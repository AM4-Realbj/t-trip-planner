import { describe, expect, it, vi } from "vitest";

import { fetchHourlyForecastFromOpenMeteo } from "./open-meteo";

const RESPONSE = {
  hourly: {
    time: ["2026-10-31T14:00", "2026-10-31T15:00"],
    temperature_2m: [14.3, 15],
    apparent_temperature: [12.1, 13],
    precipitation_probability: [10, null],
    weather_code: [0, 3],
  },
};

describe("Open-Meteo 시간별 예보", () => {
  it("좌표로 조회하고 공항 현지 정시별 값으로 바꿔 돌려준다", async () => {
    const fetchMock = vi.fn(async () => Response.json(RESPONSE));

    const points = await fetchHourlyForecastFromOpenMeteo(37.4691, 126.451, {
      fetch: fetchMock,
    });

    expect(points).toEqual([
      {
        localTime: "2026-10-31T14:00",
        temperatureC: 14.3,
        apparentC: 12.1,
        precipitationProbability: 10,
        weatherCode: 0,
      },
      {
        localTime: "2026-10-31T15:00",
        temperatureC: 15,
        apparentC: 13,
        precipitationProbability: 0,
        weatherCode: 3,
      },
    ]);
    const [url] = fetchMock.mock.calls[0] as unknown as [string];
    const query = new URL(url).searchParams;
    expect(query.get("latitude")).toBe("37.4691");
    expect(query.get("longitude")).toBe("126.451");
    expect(query.get("timezone")).toBe("auto");
    expect(query.get("forecast_days")).toBe("16");
  });

  it("응답이 실패하면 던진다", async () => {
    await expect(
      fetchHourlyForecastFromOpenMeteo(0, 0, {
        fetch: vi.fn(async () => new Response("{}", { status: 500 })),
      }),
    ).rejects.toThrow();
  });
});
