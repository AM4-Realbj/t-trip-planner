import type { HourlyPoint } from "../types";

const FORECAST_DAYS = 16;

type Options = { fetch?: typeof fetch };

type RawForecast = {
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: (number | null)[];
    weather_code: number[];
  };
};

/** 좌표의 현지 시각 기준 시간별 예보를 16일치 가져온다. */
export async function fetchHourlyForecastFromOpenMeteo(
  latitude: number,
  longitude: number,
  { fetch: fetchImpl = fetch }: Options = {},
): Promise<HourlyPoint[]> {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly:
      "temperature_2m,apparent_temperature,precipitation_probability,weather_code",
    forecast_days: String(FORECAST_DAYS),
    timezone: "auto",
  });
  const response = await fetchImpl(
    `https://api.open-meteo.com/v1/forecast?${query}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error(`Open-Meteo 조회 실패: HTTP ${response.status}`);
  }

  const { hourly } = (await response.json()) as RawForecast;
  return hourly.time.map((localTime, i) => ({
    localTime,
    temperatureC: hourly.temperature_2m[i],
    apparentC: hourly.apparent_temperature[i],
    precipitationProbability: hourly.precipitation_probability[i] ?? 0,
    weatherCode: hourly.weather_code[i],
  }));
}
