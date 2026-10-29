import { lookupFlightOutfit, validateLookupInput } from "./lookup";
import { fetchFlightFromAeroDataBox } from "./sources/aerodatabox";
import { fetchHourlyForecastFromOpenMeteo } from "./sources/open-meteo";
import type { LookupInput, LookupResult } from "./types";

export { validateLookupInput };
export type {
  AirportComparison,
  AirportStop,
  FlightLeg,
  LookupErrors,
  LookupInput,
  LookupResult,
  Outfit,
  StopForecast,
  Weather,
  WeatherKind,
} from "./types";

/** 실제 외부 서비스로 편명의 두 공항 날씨와 추천 옷을 조회한다. 서버에서만 호출한다. */
export function lookupFlight(input: LookupInput): Promise<LookupResult> {
  return lookupFlightOutfit(input, {
    fetchFlight: (flightNumber, date) =>
      fetchFlightFromAeroDataBox(flightNumber, date, {
        apiKey: process.env.AERODATABOX_API_KEY,
      }),
    fetchHourlyForecast: (latitude, longitude) =>
      fetchHourlyForecastFromOpenMeteo(latitude, longitude),
    now: () => new Date(),
  });
}
