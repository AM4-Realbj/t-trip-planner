import { compareWeather } from "./comparison";
import { changeTip, recommendOutfit } from "./outfit";
import type {
  AirportStop,
  FlightLeg,
  ItineraryStop,
  LookupDeps,
  LookupErrors,
  LookupInput,
  LookupResult,
  PairComparison,
  StopForecast,
} from "./types";
import { pickHour, toWeather } from "./weather";

const FLIGHT_FORMAT = /^[A-Z0-9]{2}\d{1,4}$/;
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MAX_LEGS = 4;
/** 환승편은 앞 편이 도착한 날부터 이 일수 뒤까지 찾는다. */
const CONNECTION_SEARCH_DAYS = 3;

function normalizeFlight(raw: string) {
  return raw.replace(/\s+/g, "").toUpperCase();
}

/** 지구에서 가장 늦게 날이 바뀌는 곳(UTC-12)의 오늘 날짜. 이보다 이전이면 어디서도 지난 날짜다. */
function earliestTodayAnywhere(now: Date) {
  return new Date(now.getTime() - 12 * HOUR_MS).toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  return new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10);
}

export function validateLookupInput(
  input: LookupInput,
  now: Date,
): LookupErrors {
  const errors: LookupErrors = {};
  const flights = input.flights.map(normalizeFlight);
  const date = input.date.trim();
  const ordinal = (i: number) => (flights.length > 1 ? `${i + 1}편 ` : "");

  if (flights.length > MAX_LEGS) {
    errors.flight = `편명은 ${MAX_LEGS}편까지 입력할 수 있어요.`;
  } else {
    const bad = flights.findIndex((f) => !FLIGHT_FORMAT.test(f));
    if (bad >= 0) {
      errors.flight = flights[bad]
        ? `${ordinal(bad)}편명 형식이 맞지 않아요. 항공사 코드 2자와 숫자로 입력해 주세요.`
        : `${ordinal(bad)}편명을 입력해 주세요.`;
    }
  }

  if (!date) {
    errors.date = "날짜를 입력해 주세요.";
  } else if (!DATE_FORMAT.test(date) || Number.isNaN(Date.parse(date))) {
    errors.date = "날짜 형식을 확인해 주세요.";
  } else if (date < earliestTodayAnywhere(now)) {
    errors.date = "이미 지난 날짜는 조회할 수 없어요.";
  }

  return errors;
}

type Connection =
  | { leg: FlightLeg }
  | { failure: "not-found" | "no-connection" };

/** 앞 편이 도착한 뒤에 출발하는 가장 이른 환승편을 날짜를 바꿔 가며 찾는다. */
async function findConnection(
  flightNumber: string,
  previous: FlightLeg,
  deps: LookupDeps,
): Promise<Connection> {
  const arrivedAt = Date.parse(previous.arrival.scheduledUtc);
  const firstDate = previous.arrival.scheduledLocal.slice(0, 10);
  let sawAny = false;

  for (let day = 0; day <= CONNECTION_SEARCH_DAYS; day++) {
    const leg = await deps.fetchFlight(flightNumber, addDays(firstDate, day));
    if (!leg) continue;
    sawAny = true;
    if (Date.parse(leg.departure.scheduledUtc) >= arrivedAt) return { leg };
  }
  return { failure: sawAny ? "no-connection" : "not-found" };
}

export async function lookupFlightOutfit(
  input: LookupInput,
  deps: LookupDeps,
): Promise<LookupResult> {
  const errors = validateLookupInput(input, deps.now());
  if (Object.keys(errors).length > 0) return { status: "invalid", errors };

  const flights = input.flights.map(normalizeFlight);
  const legs: FlightLeg[] = [];

  try {
    const first = await deps.fetchFlight(flights[0], input.date.trim());
    if (!first) return { status: "not-found", legIndex: 0 };
    legs.push(first);

    for (let i = 1; i < flights.length; i++) {
      const previous = legs[i - 1];
      const found = await findConnection(flights[i], previous, deps);
      if ("failure" in found) return { status: found.failure, legIndex: i };
      if (found.leg.departure.iata !== previous.arrival.iata) {
        return {
          status: "airport-mismatch",
          legIndex: i,
          from: previous.arrival.iata,
          to: found.leg.departure.iata,
        };
      }
      legs.push(found.leg);
    }
  } catch {
    return { status: "flight-error" };
  }

  const stops = await Promise.all(buildStops(legs).map((s) => withForecast(s, deps)));
  const comparisons = comparePairs(stops);
  const allOk = stops.every((s) => s.forecast.status === "ok");

  return {
    status: "ok",
    legs,
    stops,
    comparisons,
    tip: allOk ? changeTip(stops) : undefined,
  };
}

type StopDraft = Omit<ItineraryStop, "forecast">;

function buildStops(legs: FlightLeg[]): StopDraft[] {
  const stops: StopDraft[] = [{ role: "출발", stop: legs[0].departure }];
  for (let i = 1; i < legs.length; i++) {
    const arrival = legs[i - 1].arrival;
    const boarding = legs[i].departure;
    stops.push({
      role: "환승",
      stop: boarding,
      arrivalLocal: arrival.scheduledLocal,
      layoverMinutes: Math.round(
        (Date.parse(boarding.scheduledUtc) - Date.parse(arrival.scheduledUtc)) / 60000,
      ),
    });
  }
  stops.push({ role: "도착", stop: legs[legs.length - 1].arrival });
  return stops;
}

async function withForecast(
  draft: StopDraft,
  deps: LookupDeps,
): Promise<ItineraryStop> {
  return { ...draft, forecast: await forecastAt(draft.stop, deps) };
}

async function forecastAt(
  stop: AirportStop,
  deps: LookupDeps,
): Promise<StopForecast> {
  try {
    const hours = await deps.fetchHourlyForecast(stop.latitude, stop.longitude);
    const point = pickHour(hours, stop.scheduledLocal);
    if (!point) return { status: "unavailable" };
    const weather = toWeather(point);
    return { status: "ok", weather, outfit: recommendOutfit(weather) };
  } catch {
    return { status: "failed" };
  }
}

function comparePairs(stops: ItineraryStop[]): PairComparison[] {
  const pairs: PairComparison[] = [];
  for (let i = 1; i < stops.length; i++) {
    const from = stops[i - 1];
    const to = stops[i];
    if (from.forecast.status === "ok" && to.forecast.status === "ok") {
      pairs.push({
        from: from.stop.iata,
        to: to.stop.iata,
        comparison: compareWeather(from.forecast.weather, to.forecast.weather),
      });
    }
  }
  return pairs;
}
