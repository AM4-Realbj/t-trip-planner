import { describe, expect, it, vi } from "vitest";

import { lookupFlightOutfit } from "./lookup";
import type { AirportStop, FlightLeg, HourlyPoint, LookupDeps } from "./types";

const ICN: AirportStop = {
  iata: "ICN",
  name: "Seoul Incheon",
  municipality: "Seoul",
  terminal: "2",
  timeZone: "Asia/Seoul",
  latitude: 37.4691,
  longitude: 126.451,
  scheduledLocal: "2026-10-31T14:30",
  scheduledUtc: "2026-10-31T05:30Z",
};
const LAX_ARRIVAL: AirportStop = {
  iata: "LAX",
  name: "Los Angeles",
  municipality: "Los Angeles",
  terminal: "B",
  timeZone: "America/Los_Angeles",
  latitude: 33.9425,
  longitude: -118.408,
  scheduledLocal: "2026-10-31T09:30",
  scheduledUtc: "2026-10-31T16:30Z",
};
const LAX_BOARDING: AirportStop = {
  ...LAX_ARRIVAL,
  terminal: "6",
  scheduledLocal: "2026-10-31T12:45",
  scheduledUtc: "2026-10-31T19:45Z",
};
const JFK: AirportStop = {
  iata: "JFK",
  name: "New York John F Kennedy",
  municipality: "New York",
  timeZone: "America/New_York",
  latitude: 40.6413,
  longitude: -73.7781,
  scheduledLocal: "2026-10-31T21:05",
  scheduledUtc: "2026-11-01T01:05Z",
};

const KE17: FlightLeg = {
  flightNumber: "KE17",
  airline: "Korean Air",
  departure: ICN,
  arrival: LAX_ARRIVAL,
};
const AA1234: FlightLeg = {
  flightNumber: "AA1234",
  airline: "American Airlines",
  departure: LAX_BOARDING,
  arrival: JFK,
};

const hour = (
  localTime: string,
  p: Partial<HourlyPoint> = {},
): HourlyPoint => ({
  localTime,
  temperatureC: 14,
  apparentC: 12,
  precipitationProbability: 10,
  weatherCode: 0,
  ...p,
});

const ICN_HOURS = [hour("2026-10-31T14:00")];
const LAX_HOURS = [
  hour("2026-10-31T09:00", {
    temperatureC: 18,
    apparentC: 17,
    precipitationProbability: 60,
    weatherCode: 61,
  }),
  hour("2026-10-31T12:00", {
    temperatureC: 20,
    apparentC: 19,
    precipitationProbability: 30,
    weatherCode: 3,
  }),
];
const JFK_HOURS = [
  hour("2026-10-31T21:00", { temperatureC: 9, apparentC: 6, precipitationProbability: 0 }),
];

const HOURS_BY_LONGITUDE: Record<number, HourlyPoint[]> = {
  126.451: ICN_HOURS,
  [-118.408]: LAX_HOURS,
  [-73.7781]: JFK_HOURS,
};

function fakeDeps(overrides: Partial<LookupDeps> = {}) {
  const flights: Record<string, FlightLeg> = { KE17, AA1234 };
  const deps = {
    fetchFlight: vi.fn(async (flightNumber: string) => flights[flightNumber] ?? null),
    fetchHourlyForecast: vi.fn(
      async (_latitude: number, longitude: number) =>
        HOURS_BY_LONGITUDE[longitude] ?? [],
    ),
    now: () => new Date("2026-10-29T03:00:00Z"),
    ...overrides,
  };
  return deps satisfies LookupDeps;
}

const one = (flight = "KE17", date = "2026-10-31") => ({ flights: [flight], date });

function okStops(result: Awaited<ReturnType<typeof lookupFlightOutfit>>) {
  if (result.status !== "ok") throw new Error(`status: ${result.status}`);
  return result;
}

describe("입력 검증", () => {
  it("편명 형식이 맞지 않으면 조회 없이 편명 칸 오류를 돌려준다", async () => {
    const deps = fakeDeps();

    const result = await lookupFlightOutfit(one("K"), deps);

    expect(result).toEqual({
      status: "invalid",
      errors: {
        flight: "편명 형식이 맞지 않아요. 항공사 코드 2자와 숫자로 입력해 주세요.",
      },
    });
    expect(deps.fetchFlight).not.toHaveBeenCalled();
  });

  it("편명과 날짜가 비어 있으면 각 칸의 안내를 함께 돌려준다", async () => {
    const result = await lookupFlightOutfit({ flights: ["  "], date: "" }, fakeDeps());

    expect(result).toEqual({
      status: "invalid",
      errors: { flight: "편명을 입력해 주세요.", date: "날짜를 입력해 주세요." },
    });
  });

  it("편명이 여러 개일 때는 몇 번째 편이 문제인지 안내한다", async () => {
    const deps = fakeDeps();

    const empty = await lookupFlightOutfit({ flights: ["KE17", ""], date: "2026-10-31" }, deps);
    const bad = await lookupFlightOutfit({ flights: ["KE17", "A"], date: "2026-10-31" }, deps);

    expect(empty).toMatchObject({
      errors: { flight: "2편 편명을 입력해 주세요." },
    });
    expect(bad).toMatchObject({
      errors: {
        flight: "2편 편명 형식이 맞지 않아요. 항공사 코드 2자와 숫자로 입력해 주세요.",
      },
    });
    expect(deps.fetchFlight).not.toHaveBeenCalled();
  });

  it("편명은 4편까지만 받는다", async () => {
    const result = await lookupFlightOutfit(
      { flights: ["KE1", "KE2", "KE3", "KE4", "KE5"], date: "2026-10-31" },
      fakeDeps(),
    );

    expect(result).toEqual({
      status: "invalid",
      errors: { flight: "편명은 4편까지 입력할 수 있어요." },
    });
  });

  it("이미 지난 날짜는 날짜 칸에서 안내하고 조회하지 않는다", async () => {
    const deps = fakeDeps();

    const result = await lookupFlightOutfit(one("KE17", "2026-10-27"), deps);

    expect(result).toEqual({
      status: "invalid",
      errors: { date: "이미 지난 날짜는 조회할 수 없어요." },
    });
    expect(deps.fetchFlight).not.toHaveBeenCalled();
  });

  it("지구 어디에서든 아직 오늘인 날짜는 소문자와 공백이 섞인 편명도 조회한다", async () => {
    // 가장 늦게 날이 바뀌는 곳(UTC-12) 기준으로 지난 날짜만 막는다.
    const deps = fakeDeps({ now: () => new Date("2026-10-29T10:00:00Z") });

    await lookupFlightOutfit(one("ke 17", "2026-10-28"), deps);

    expect(deps.fetchFlight).toHaveBeenCalledWith("KE17", "2026-10-28");
  });
});

describe("편명 하나의 조회 결과", () => {
  it("편명을 찾지 못하면 not-found를 돌려주고 날씨는 조회하지 않는다", async () => {
    const deps = fakeDeps({ fetchFlight: vi.fn(async () => null) });

    const result = await lookupFlightOutfit(one("XX999"), deps);

    expect(result).toEqual({ status: "not-found", legIndex: 0 });
    expect(deps.fetchHourlyForecast).not.toHaveBeenCalled();
  });

  it("편명 조회가 실패하면 flight-error를 돌려준다", async () => {
    const deps = fakeDeps({
      fetchFlight: vi.fn(async () => {
        throw new Error("402");
      }),
    });

    expect(await lookupFlightOutfit(one(), deps)).toEqual({ status: "flight-error" });
  });

  it("출발과 도착 두 공항의 예정 시각 날씨와 추천 옷을 각 공항 기준으로 돌려준다", async () => {
    const result = okStops(await lookupFlightOutfit(one(), fakeDeps()));

    expect(result.legs).toHaveLength(1);
    expect(result.stops).toHaveLength(2);
    expect(result.stops[0]).toMatchObject({
      role: "출발",
      stop: { iata: "ICN" },
      forecast: {
        status: "ok",
        weather: {
          kind: "clear",
          label: "맑음",
          temperatureC: 14,
          apparentC: 12,
          precipitationProbability: 10,
        },
        outfit: { outer: "얇은 재킷이나 가디건", carry: [] },
      },
    });
    expect(result.stops[1]).toMatchObject({
      role: "도착",
      stop: { iata: "LAX" },
      forecast: {
        status: "ok",
        weather: { kind: "rain", label: "비", temperatureC: 18 },
        outfit: { outer: "방수되는 얇은 재킷", carry: ["우산"] },
      },
    });
  });

  it("예정 시각이 포함된 정시 예보를 고른다", async () => {
    const deps = fakeDeps({
      fetchFlight: vi.fn(async () => ({
        ...KE17,
        departure: { ...ICN, scheduledLocal: "2026-10-31T14:59" },
      })),
      fetchHourlyForecast: vi.fn(async (_la: number, longitude: number) =>
        longitude > 0
          ? [
              hour("2026-10-31T13:00", { apparentC: 30 }),
              hour("2026-10-31T14:00", { apparentC: 12 }),
              hour("2026-10-31T15:00", { apparentC: 30 }),
            ]
          : LAX_HOURS,
      ),
    });

    const result = okStops(await lookupFlightOutfit(one(), deps));

    expect(result.stops[0].forecast).toMatchObject({ weather: { apparentC: 12 } });
  });

  it.each([
    [0, "clear", "맑음"],
    [2, "cloudy", "구름 많음"],
    [45, "fog", "안개"],
    [63, "rain", "비"],
    [73, "snow", "눈"],
    [95, "thunder", "뇌우"],
  ])("날씨 코드 %i은 %s(%s)로 표시한다", async (weatherCode, kind, label) => {
    const deps = fakeDeps({
      fetchHourlyForecast: vi.fn(async () => [
        hour("2026-10-31T14:00", { weatherCode, precipitationProbability: 10 }),
        hour("2026-10-31T09:00", { weatherCode, precipitationProbability: 10 }),
      ]),
    });

    const result = okStops(await lookupFlightOutfit(one(), deps));

    expect(result.stops[0].forecast).toMatchObject({ weather: { kind, label } });
  });

  it.each([
    [60, "rain", "비 올 가능성"],
    [59, "cloudy", "구름 많음"],
  ])("흐린 날씨 코드라도 강수 확률이 %i%%이면 %s로 표시한다", async (probability, kind, label) => {
    const deps = fakeDeps({
      fetchHourlyForecast: vi.fn(async () => [
        hour("2026-10-31T14:00", { weatherCode: 3, precipitationProbability: probability }),
        hour("2026-10-31T09:00", { weatherCode: 3, precipitationProbability: probability }),
      ]),
    });

    const result = okStops(await lookupFlightOutfit(one(), deps));

    expect(result.stops[0].forecast).toMatchObject({
      weather: { kind, label, precipitationProbability: probability },
    });
  });

  it.each([
    [30, "기내용 얇은 가디건만 챙기세요", "반팔 티셔츠, 얇은 바지"],
    [22, "가벼운 가디건 (벗어도 돼요)", "얇은 긴팔 티셔츠, 긴 바지"],
    [12, "얇은 재킷이나 가디건", "긴팔 티셔츠, 긴 바지"],
    [7, "도톰한 재킷이나 코트", "긴팔 니트, 긴 바지"],
    [-3, "두꺼운 패딩이나 코트", "니트와 기모 바지"],
  ])("체감 %i°이면 겉옷 '%s'를 추천한다", async (apparentC, outer, base) => {
    const deps = fakeDeps({
      fetchHourlyForecast: vi.fn(async () => [
        hour("2026-10-31T14:00", { apparentC }),
        hour("2026-10-31T09:00", { apparentC }),
      ]),
    });

    const result = okStops(await lookupFlightOutfit(one(), deps));

    expect(result.stops[0].forecast).toMatchObject({ outfit: { outer, base } });
  });

  it("영하권이면 목도리·장갑을, 비 올 확률이 50% 이상이면 우산을 지참 물품으로 알린다", async () => {
    const deps = fakeDeps({
      fetchHourlyForecast: vi.fn(async (_la: number, longitude: number) =>
        longitude > 0
          ? [hour("2026-10-31T14:00", { apparentC: -3 })]
          : [hour("2026-10-31T09:00", { weatherCode: 3, precipitationProbability: 50 })],
      ),
    });

    const result = okStops(await lookupFlightOutfit(one(), deps));

    expect(result.stops[0].forecast).toMatchObject({ outfit: { carry: ["목도리·장갑"] } });
    expect(result.stops[1].forecast).toMatchObject({ outfit: { carry: ["우산"] } });
  });
});

describe("공항 간 날씨 차이와 갈아입기", () => {
  it("상태 변화, 기온 차이(도착 기준), 강수 확률 차이를 두 값에서 계산한다", async () => {
    const result = okStops(await lookupFlightOutfit(one(), fakeDeps()));

    expect(result.comparisons).toHaveLength(1);
    expect(result.comparisons[0]).toMatchObject({
      from: "ICN",
      to: "LAX",
      comparison: {
        condition: { changed: true, emphasis: "strong" },
        temperature: { fromC: 14, toC: 18, deltaC: 4 },
        precipitation: { fromPercent: 10, toPercent: 60, deltaPoints: 50, emphasis: "strong" },
      },
    });
  });

  it("상태가 같고 강수 확률 차이가 작으면 강조하지 않는다", async () => {
    const deps = fakeDeps({
      fetchHourlyForecast: vi.fn(async (_la: number, longitude: number) =>
        longitude > 0
          ? ICN_HOURS
          : [hour("2026-10-31T09:00", { weatherCode: 0, precipitationProbability: 20 })],
      ),
    });

    const result = okStops(await lookupFlightOutfit(one(), deps));

    expect(result.comparisons[0].comparison).toMatchObject({
      condition: { changed: false, emphasis: "normal" },
      precipitation: { deltaPoints: 10, emphasis: "normal" },
    });
  });

  it("두 공항의 옷차림을 비교한 갈아입기 안내를 만든다", async () => {
    const result = okStops(await lookupFlightOutfit(one(), fakeDeps()));

    expect(result.tip).toBe(
      "출발 공항(ICN)은 체감 12°라 얇은 재킷이나 가디건 차림으로 나서고, 도착 공항(LAX)은 체감 17°라 방수되는 얇은 재킷 차림이 좋아요. 겉옷만 벗고 입는 것으로 기내 온도와 두 공항 날씨에 맞춰 조절하세요.",
    );
  });
});

describe("예보가 없거나 실패한 경우", () => {
  it("예보 기간을 벗어난 날짜는 일정은 보여 주고 날씨는 unavailable로 돌려준다", async () => {
    const deps = fakeDeps({ fetchHourlyForecast: vi.fn(async () => []) });

    const result = okStops(await lookupFlightOutfit(one(), deps));

    expect(result.legs[0].flightNumber).toBe("KE17");
    expect(result.stops.map((s) => s.forecast.status)).toEqual(["unavailable", "unavailable"]);
    expect(result.comparisons).toEqual([]);
    expect(result.tip).toBeUndefined();
  });

  it("한쪽 공항 날씨 조회가 실패하면 성공한 쪽은 그대로 두고 차이는 숨긴다", async () => {
    const deps = fakeDeps({
      fetchHourlyForecast: vi.fn(async (_la: number, longitude: number) => {
        if (longitude < 0) throw new Error("timeout");
        return ICN_HOURS;
      }),
    });

    const result = okStops(await lookupFlightOutfit(one(), deps));

    expect(result.stops.map((s) => s.forecast.status)).toEqual(["ok", "failed"]);
    expect(result.comparisons).toEqual([]);
    expect(result.tip).toBeUndefined();
  });
});

describe("환승을 포함한 여러 편명", () => {
  const two = (date = "2026-10-31") => ({ flights: ["KE17", "AA1234"], date });

  it("출발, 환승, 도착 공항을 순서대로 돌려준다", async () => {
    const result = okStops(await lookupFlightOutfit(two(), fakeDeps()));

    expect(result.legs.map((l) => l.flightNumber)).toEqual(["KE17", "AA1234"]);
    expect(result.stops.map((s) => [s.role, s.stop.iata])).toEqual([
      ["출발", "ICN"],
      ["환승", "LAX"],
      ["도착", "JFK"],
    ]);
  });

  it("환승 공항은 도착 시각, 탑승 시각, 환승 대기 시간을 알리고 날씨는 탑승 시각 기준이다", async () => {
    const result = okStops(await lookupFlightOutfit(two(), fakeDeps()));

    expect(result.stops[1]).toMatchObject({
      arrivalLocal: "2026-10-31T09:30",
      stop: { scheduledLocal: "2026-10-31T12:45" },
      layoverMinutes: 195,
      // 09:00 예보(비 60%)가 아니라 탑승 12:00 예보(구름 많음 30%)다
      forecast: { weather: { kind: "cloudy", temperatureC: 20, precipitationProbability: 30 } },
    });
  });

  it("환승편은 앞 편이 도착한 공항 현지 날짜로 조회한다", async () => {
    const deps = fakeDeps();

    await lookupFlightOutfit(two(), deps);

    expect(deps.fetchFlight).toHaveBeenNthCalledWith(1, "KE17", "2026-10-31");
    expect(deps.fetchFlight).toHaveBeenNthCalledWith(2, "AA1234", "2026-10-31");
  });

  it("그날 운항이 없으면 다음 날을 찾아 앞 편 도착 이후에 출발하는 편으로 정한다", async () => {
    const nextDay: FlightLeg = {
      ...AA1234,
      departure: {
        ...LAX_BOARDING,
        scheduledLocal: "2026-11-01T06:10",
        scheduledUtc: "2026-11-01T13:10Z",
      },
      arrival: { ...JFK, scheduledLocal: "2026-11-01T14:30", scheduledUtc: "2026-11-01T19:30Z" },
    };
    const deps = fakeDeps({
      fetchFlight: vi.fn(async (flightNumber: string, date: string) =>
        flightNumber === "KE17" ? KE17 : date === "2026-11-01" ? nextDay : null,
      ),
    });

    const result = okStops(await lookupFlightOutfit(two(), deps));

    expect(deps.fetchFlight).toHaveBeenCalledWith("AA1234", "2026-11-01");
    expect(result.stops[1]).toMatchObject({
      stop: { scheduledLocal: "2026-11-01T06:10" },
      layoverMinutes: 1240,
    });
  });

  it("앞 편 도착보다 먼저 출발하는 편뿐이면 no-connection이다", async () => {
    const earlier: FlightLeg = {
      ...AA1234,
      departure: { ...LAX_BOARDING, scheduledUtc: "2026-10-31T10:00Z" },
    };
    const deps = fakeDeps({
      fetchFlight: vi.fn(async (flightNumber: string, date: string) =>
        flightNumber === "KE17" ? KE17 : date === "2026-10-31" ? earlier : null,
      ),
    });

    expect(await lookupFlightOutfit(two(), deps)).toEqual({
      status: "no-connection",
      legIndex: 1,
    });
  });

  it("환승편이 어느 날에도 없으면 몇 번째 편인지 알려 not-found를 돌려준다", async () => {
    const deps = fakeDeps({
      fetchFlight: vi.fn(async (flightNumber: string) =>
        flightNumber === "KE17" ? KE17 : null,
      ),
    });

    const result = await lookupFlightOutfit(two(), deps);

    expect(result).toEqual({ status: "not-found", legIndex: 1 });
    expect(deps.fetchFlight).toHaveBeenCalledTimes(5); // KE17 + 환승편 4일 탐색
  });

  it("앞 편 도착 공항과 다음 편 출발 공항이 다르면 airport-mismatch다", async () => {
    const elsewhere: FlightLeg = {
      ...AA1234,
      departure: { ...LAX_BOARDING, iata: "SFO" },
    };
    const deps = fakeDeps({
      fetchFlight: vi.fn(async (flightNumber: string) =>
        flightNumber === "KE17" ? KE17 : elsewhere,
      ),
    });

    expect(await lookupFlightOutfit(two(), deps)).toEqual({
      status: "airport-mismatch",
      legIndex: 1,
      from: "LAX",
      to: "SFO",
    });
  });

  it("환승 조회가 실패하면 flight-error다", async () => {
    const deps = fakeDeps({
      fetchFlight: vi.fn(async (flightNumber: string) => {
        if (flightNumber === "AA1234") throw new Error("429");
        return KE17;
      }),
    });

    expect(await lookupFlightOutfit(two(), deps)).toEqual({ status: "flight-error" });
  });

  it("이웃한 공항 쌍마다 차이를 계산하고 갈아입기 안내에 모든 공항을 담는다", async () => {
    const result = okStops(await lookupFlightOutfit(two(), fakeDeps()));

    expect(result.comparisons.map((c) => `${c.from}→${c.to}`)).toEqual([
      "ICN→LAX",
      "LAX→JFK",
    ]);
    expect(result.comparisons[1].comparison.temperature).toEqual({
      fromC: 20,
      toC: 9,
      deltaC: -11,
    });
    expect(result.tip).toContain("출발 공항(ICN)");
    expect(result.tip).toContain("환승 공항(LAX)");
    expect(result.tip).toContain("도착 공항(JFK)");
  });

  it("한 공항의 날씨만 실패하면 그 카드만 실패로 두고 그 공항이 낀 차이는 숨긴다", async () => {
    const deps = fakeDeps({
      fetchHourlyForecast: vi.fn(async (_la: number, longitude: number) => {
        if (longitude === -118.408) throw new Error("timeout");
        return HOURS_BY_LONGITUDE[longitude];
      }),
    });

    const result = okStops(await lookupFlightOutfit(two(), deps));

    expect(result.stops.map((s) => s.forecast.status)).toEqual(["ok", "failed", "ok"]);
    expect(result.comparisons).toEqual([]);
    expect(result.tip).toBeUndefined();
  });
});
