export type WeatherKind =
  | "clear"
  | "cloudy"
  | "fog"
  | "rain"
  | "snow"
  | "thunder";

export type Weather = {
  kind: WeatherKind;
  label: string;
  temperatureC: number;
  apparentC: number;
  precipitationProbability: number;
};

export type OuterIcon = "jacket" | "coat";

export type CarryItem = "우산" | "목도리·장갑";

export type Outfit = {
  outer: string;
  outerIcon: OuterIcon;
  outerShort: string;
  base: string;
  carry: CarryItem[];
};

export type AirportStop = {
  iata: string;
  name: string;
  municipality: string;
  terminal?: string;
  timeZone: string;
  latitude: number;
  longitude: number;
  /** 공항 현지 예정 시각, `YYYY-MM-DDTHH:mm` */
  scheduledLocal: string;
  /** 같은 시각의 UTC, `YYYY-MM-DDTHH:mmZ` */
  scheduledUtc: string;
};

export type FlightLeg = {
  flightNumber: string;
  airline?: string;
  departure: AirportStop;
  arrival: AirportStop;
};

export type StopForecast =
  | { status: "ok"; weather: Weather; outfit: Outfit }
  | { status: "unavailable" }
  | { status: "failed" };

export type StopRole = "출발" | "환승" | "도착";

/** 일정의 한 공항. 날씨는 `stop.scheduledLocal`(출발·탑승·도착 시각) 기준이다. */
export type ItineraryStop = {
  role: StopRole;
  stop: AirportStop;
  /** 환승 공항에서 앞 편이 도착하는 현지 시각 */
  arrivalLocal?: string;
  layoverMinutes?: number;
  forecast: StopForecast;
};

export type ComparisonEmphasis = "strong" | "normal";

export type AirportComparison = {
  condition: {
    from: Weather;
    to: Weather;
    changed: boolean;
    emphasis: ComparisonEmphasis;
  };
  temperature: { fromC: number; toC: number; deltaC: number };
  precipitation: {
    fromPercent: number;
    toPercent: number;
    deltaPoints: number;
    emphasis: ComparisonEmphasis;
  };
};

export type PairComparison = {
  from: string;
  to: string;
  comparison: AirportComparison;
};

export type LookupInput = { flights: string[]; date: string };

export type LookupErrors = { flight?: string; date?: string };

export type LookupResult =
  | { status: "invalid"; errors: LookupErrors }
  /** legIndex는 0부터 센 편 순서 */
  | { status: "not-found"; legIndex: number }
  | { status: "no-connection"; legIndex: number }
  | { status: "airport-mismatch"; legIndex: number; from: string; to: string }
  | { status: "flight-error" }
  | {
      status: "ok";
      legs: FlightLeg[];
      stops: ItineraryStop[];
      comparisons: PairComparison[];
      tip?: string;
    };

export type HourlyPoint = {
  /** 공항 현지 정시, `YYYY-MM-DDTHH:00` */
  localTime: string;
  temperatureC: number;
  apparentC: number;
  precipitationProbability: number;
  weatherCode: number;
};

export type LookupDeps = {
  fetchFlight: (flightNumber: string, date: string) => Promise<FlightLeg | null>;
  fetchHourlyForecast: (
    latitude: number,
    longitude: number,
  ) => Promise<HourlyPoint[]>;
  now: () => Date;
};
