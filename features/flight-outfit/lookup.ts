import { compareWeather } from "./comparison";
import { changeTip, recommendOutfit } from "./outfit";
import type {
  AirportStop,
  FlightLeg,
  LookupDeps,
  LookupErrors,
  LookupInput,
  LookupResult,
  StopForecast,
} from "./types";
import { pickHour, toWeather } from "./weather";

const FLIGHT_FORMAT = /^[A-Z0-9]{2}\d{1,4}$/;
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const HOUR_MS = 60 * 60 * 1000;

function normalizeFlight(raw: string) {
  return raw.replace(/\s+/g, "").toUpperCase();
}

/** 지구에서 가장 늦게 날이 바뀌는 곳(UTC-12)의 오늘 날짜. 이보다 이전이면 어디서도 지난 날짜다. */
function earliestTodayAnywhere(now: Date) {
  return new Date(now.getTime() - 12 * HOUR_MS).toISOString().slice(0, 10);
}

export function validateLookupInput(
  input: LookupInput,
  now: Date,
): LookupErrors {
  const errors: LookupErrors = {};
  const flight = normalizeFlight(input.flight);
  const date = input.date.trim();

  if (!flight) {
    errors.flight = "편명을 입력해 주세요.";
  } else if (!FLIGHT_FORMAT.test(flight)) {
    errors.flight =
      "편명 형식이 맞지 않아요. 항공사 코드 2자와 숫자로 입력해 주세요.";
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

export async function lookupFlightOutfit(
  input: LookupInput,
  deps: LookupDeps,
): Promise<LookupResult> {
  const errors = validateLookupInput(input, deps.now());
  if (Object.keys(errors).length > 0) return { status: "invalid", errors };

  let flight: FlightLeg | null;
  try {
    flight = await deps.fetchFlight(
      normalizeFlight(input.flight),
      input.date.trim(),
    );
  } catch {
    return { status: "flight-error" };
  }
  if (!flight) return { status: "not-found" };

  const [departure, arrival] = await Promise.all([
    forecastAt(flight.departure, deps),
    forecastAt(flight.arrival, deps),
  ]);

  if (departure.status !== "ok" || arrival.status !== "ok") {
    return { status: "ok", flight, departure, arrival };
  }
  return {
    status: "ok",
    flight,
    departure,
    arrival,
    comparison: compareWeather(departure.weather, arrival.weather),
    tip: changeTip(
      { iata: flight.departure.iata, ...departure },
      { iata: flight.arrival.iata, ...arrival },
    ),
  };
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
