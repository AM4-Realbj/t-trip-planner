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

export type LookupInput = { flight: string; date: string };

export type LookupErrors = { flight?: string; date?: string };

export type LookupResult =
  | { status: "invalid"; errors: LookupErrors }
  | { status: "not-found" }
  | { status: "flight-error" }
  | {
      status: "ok";
      flight: FlightLeg;
      departure: StopForecast;
      arrival: StopForecast;
      comparison?: AirportComparison;
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
