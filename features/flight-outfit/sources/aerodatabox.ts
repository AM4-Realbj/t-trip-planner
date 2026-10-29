import type { AirportStop, FlightLeg } from "../types";

const HOST = "aerodatabox.p.rapidapi.com";

type Options = {
  apiKey: string | undefined;
  fetch?: typeof fetch;
};

type RawAirportSide = {
  airport: {
    iata: string;
    name: string;
    municipalityName?: string;
    location: { lat: number; lon: number };
    timeZone: string;
  };
  scheduledTime: { local: string };
  terminal?: string;
};

type RawFlight = {
  departure: RawAirportSide;
  arrival: RawAirportSide;
  airline?: { name?: string };
};

function toStop(side: RawAirportSide): AirportStop {
  return {
    iata: side.airport.iata,
    name: side.airport.name,
    municipality: side.airport.municipalityName ?? side.airport.name,
    terminal: side.terminal,
    timeZone: side.airport.timeZone,
    latitude: side.airport.location.lat,
    longitude: side.airport.location.lon,
    // "2026-10-31 14:30+09:00" → 공항 현지 "2026-10-31T14:30"
    scheduledLocal: side.scheduledTime.local.slice(0, 16).replace(" ", "T"),
  };
}

/** 편명이 없으면 null, 조회 자체가 실패하면 던진다. */
export async function fetchFlightFromAeroDataBox(
  flightNumber: string,
  date: string,
  { apiKey, fetch: fetchImpl = fetch }: Options,
): Promise<FlightLeg | null> {
  if (!apiKey) throw new Error("AERODATABOX_API_KEY가 설정되지 않았습니다.");

  const response = await fetchImpl(
    `https://${HOST}/flights/number/${encodeURIComponent(flightNumber)}/${date}`,
    {
      headers: { "x-rapidapi-key": apiKey, "x-rapidapi-host": HOST },
      cache: "no-store",
    },
  );
  if (response.status === 204 || response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`AeroDataBox 조회 실패: HTTP ${response.status}`);
  }

  const flights = (await response.json()) as RawFlight[];
  const first = flights[0];
  if (!first) return null;

  return {
    flightNumber,
    airline: first.airline?.name,
    departure: toStop(first.departure),
    arrival: toStop(first.arrival),
  };
}
