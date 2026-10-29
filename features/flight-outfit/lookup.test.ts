import { describe, expect, it, vi } from "vitest";

import { lookupFlightOutfit } from "./lookup";
import type { FlightLeg, HourlyPoint, LookupDeps } from "./types";

const KE17: FlightLeg = {
  flightNumber: "KE17",
  airline: "Korean Air",
  departure: {
    iata: "ICN",
    name: "Seoul Incheon",
    municipality: "Seoul",
    terminal: "2",
    timeZone: "Asia/Seoul",
    latitude: 37.4691,
    longitude: 126.451,
    scheduledLocal: "2026-10-31T14:30",
  },
  arrival: {
    iata: "LAX",
    name: "Los Angeles",
    municipality: "Los Angeles",
    terminal: "B",
    timeZone: "America/Los_Angeles",
    latitude: 33.9425,
    longitude: -118.408,
    scheduledLocal: "2026-10-31T09:30",
  },
};

const ICN_HOURS: HourlyPoint[] = [
  {
    localTime: "2026-10-31T14:00",
    temperatureC: 14,
    apparentC: 12,
    precipitationProbability: 10,
    weatherCode: 0,
  },
];
const LAX_HOURS: HourlyPoint[] = [
  {
    localTime: "2026-10-31T09:00",
    temperatureC: 18,
    apparentC: 17,
    precipitationProbability: 60,
    weatherCode: 61,
  },
];

function fakeDeps(overrides: Partial<LookupDeps> = {}) {
  const deps = {
    fetchFlight: vi.fn(async () => KE17),
    fetchHourlyForecast: vi.fn(async (_latitude: number, longitude: number) =>
      longitude > 0 ? ICN_HOURS : LAX_HOURS,
    ),
    now: () => new Date("2026-10-29T03:00:00Z"),
    ...overrides,
  };
  return deps satisfies LookupDeps;
}

describe("입력 검증", () => {
  it("편명 형식이 맞지 않으면 조회 없이 편명 칸 오류를 돌려준다", async () => {
    const deps = fakeDeps();

    const result = await lookupFlightOutfit(
      { flight: "K", date: "2026-10-31" },
      deps,
    );

    expect(result).toEqual({
      status: "invalid",
      errors: {
        flight: "편명 형식이 맞지 않아요. 항공사 코드 2자와 숫자로 입력해 주세요.",
      },
    });
    expect(deps.fetchFlight).not.toHaveBeenCalled();
  });

  it("편명과 날짜가 비어 있으면 각 칸의 안내를 함께 돌려준다", async () => {
    const result = await lookupFlightOutfit(
      { flight: "  ", date: "" },
      fakeDeps(),
    );

    expect(result).toEqual({
      status: "invalid",
      errors: {
        flight: "편명을 입력해 주세요.",
        date: "날짜를 입력해 주세요.",
      },
    });
  });

  it("이미 지난 날짜는 날짜 칸에서 안내하고 조회하지 않는다", async () => {
    const deps = fakeDeps();

    const result = await lookupFlightOutfit(
      { flight: "KE17", date: "2026-10-27" },
      deps,
    );

    expect(result).toEqual({
      status: "invalid",
      errors: { date: "이미 지난 날짜는 조회할 수 없어요." },
    });
    expect(deps.fetchFlight).not.toHaveBeenCalled();
  });

  it("지구 어디에서든 아직 오늘인 날짜는 소문자와 공백이 섞인 편명도 조회한다", async () => {
    // UTC 10월 28일 15시는 서울에서는 이미 10월 29일이다. 가장 늦게 날이 바뀌는 곳(UTC-12) 기준으로 지난 날짜만 막는다.
    const deps = fakeDeps({ now: () => new Date("2026-10-29T10:00:00Z") });

    await lookupFlightOutfit({ flight: "ke 17", date: "2026-10-28" }, deps);

    expect(deps.fetchFlight).toHaveBeenCalledWith("KE17", "2026-10-28");
  });
});

describe("편명 조회 결과", () => {
  it("편명을 찾지 못하면 not-found를 돌려주고 날씨는 조회하지 않는다", async () => {
    const deps = fakeDeps({ fetchFlight: vi.fn(async () => null) });

    const result = await lookupFlightOutfit(
      { flight: "XX999", date: "2026-10-31" },
      deps,
    );

    expect(result).toEqual({ status: "not-found" });
    expect(deps.fetchHourlyForecast).not.toHaveBeenCalled();
  });

  it("편명 조회가 실패하면 flight-error를 돌려준다", async () => {
    const deps = fakeDeps({
      fetchFlight: vi.fn(async () => {
        throw new Error("402");
      }),
    });

    const result = await lookupFlightOutfit(
      { flight: "KE17", date: "2026-10-31" },
      deps,
    );

    expect(result).toEqual({ status: "flight-error" });
  });
});

describe("공항별 날씨와 추천 옷", () => {
  it("두 공항의 예정 시각 날씨와 추천 옷을 각 공항 기준으로 돌려준다", async () => {
    const result = await lookupFlightOutfit(
      { flight: "KE17", date: "2026-10-31" },
      fakeDeps(),
    );

    expect(result).toMatchObject({
      status: "ok",
      flight: { flightNumber: "KE17" },
      departure: {
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
      arrival: {
        status: "ok",
        weather: { kind: "rain", label: "비", temperatureC: 18 },
        outfit: { outer: "방수되는 얇은 재킷", carry: ["우산"] },
      },
    });
  });

  it("예정 시각이 포함된 정시 예보를 고른다", async () => {
    const deps = fakeDeps({
      fetchHourlyForecast: vi.fn(async (_latitude: number, longitude: number) =>
        longitude > 0
          ? [
              { ...ICN_HOURS[0], localTime: "2026-10-31T13:00", apparentC: 30 },
              { ...ICN_HOURS[0], localTime: "2026-10-31T14:00", apparentC: 12 },
              { ...ICN_HOURS[0], localTime: "2026-10-31T15:00", apparentC: 30 },
            ]
          : LAX_HOURS,
      ),
    });

    const result = await lookupFlightOutfit(
      { flight: "KE17", date: "2026-10-31" },
      {
        ...deps,
        fetchFlight: vi.fn(async () => ({
          ...KE17,
          departure: { ...KE17.departure, scheduledLocal: "2026-10-31T14:59" },
        })),
      },
    );

    expect(result).toMatchObject({
      departure: { weather: { apparentC: 12 } },
    });
  });

  it.each([
    [0, "clear", "맑음"],
    [2, "cloudy", "구름 많음"],
    [45, "fog", "안개"],
    [63, "rain", "비"],
    [73, "snow", "눈"],
    [95, "thunder", "뇌우"],
  ])("날씨 코드 %i은 %s(%s)로 표시한다", async (code, kind, label) => {
    const deps = fakeDeps({
      fetchHourlyForecast: vi.fn(async () => [
        { ...ICN_HOURS[0], localTime: "2026-10-31T14:00", weatherCode: code },
        { ...LAX_HOURS[0], localTime: "2026-10-31T09:00", weatherCode: code },
      ]),
    });

    const result = await lookupFlightOutfit(
      { flight: "KE17", date: "2026-10-31" },
      deps,
    );

    expect(result).toMatchObject({
      departure: { weather: { kind, label } },
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
        { ...ICN_HOURS[0], localTime: "2026-10-31T14:00", apparentC },
        { ...LAX_HOURS[0], localTime: "2026-10-31T09:00", apparentC },
      ]),
    });

    const result = await lookupFlightOutfit(
      { flight: "KE17", date: "2026-10-31" },
      deps,
    );

    expect(result).toMatchObject({
      departure: { outfit: { outer, base } },
    });
  });

  it("영하권이면 목도리·장갑을, 비 올 확률이 50% 이상이면 우산을 지참 물품으로 알린다", async () => {
    const deps = fakeDeps({
      fetchHourlyForecast: vi.fn(async (_latitude: number, longitude: number) =>
        longitude > 0
          ? [{ ...ICN_HOURS[0], localTime: "2026-10-31T14:00", apparentC: -3 }]
          : [
              {
                ...LAX_HOURS[0],
                localTime: "2026-10-31T09:00",
                weatherCode: 3,
                precipitationProbability: 50,
              },
            ],
      ),
    });

    const result = await lookupFlightOutfit(
      { flight: "KE17", date: "2026-10-31" },
      deps,
    );

    expect(result).toMatchObject({
      departure: { outfit: { carry: ["목도리·장갑"] } },
      arrival: { outfit: { carry: ["우산"] } },
    });
  });
});

describe("공항 간 날씨 차이", () => {
  it("상태 변화, 기온 차이(도착 기준), 강수 확률 차이를 두 값에서 계산한다", async () => {
    const result = await lookupFlightOutfit(
      { flight: "KE17", date: "2026-10-31" },
      fakeDeps(),
    );

    expect(result).toMatchObject({
      comparison: {
        condition: { changed: true, emphasis: "strong" },
        temperature: { fromC: 14, toC: 18, deltaC: 4 },
        precipitation: {
          fromPercent: 10,
          toPercent: 60,
          deltaPoints: 50,
          emphasis: "strong",
        },
      },
    });
  });

  it("상태가 같고 강수 확률 차이가 작으면 강조하지 않는다", async () => {
    const deps = fakeDeps({
      fetchHourlyForecast: vi.fn(async (_latitude: number, longitude: number) =>
        longitude > 0
          ? ICN_HOURS
          : [
              {
                ...LAX_HOURS[0],
                weatherCode: 0,
                precipitationProbability: 20,
              },
            ],
      ),
    });

    const result = await lookupFlightOutfit(
      { flight: "KE17", date: "2026-10-31" },
      deps,
    );

    expect(result).toMatchObject({
      comparison: {
        condition: { changed: false, emphasis: "normal" },
        precipitation: { deltaPoints: 10, emphasis: "normal" },
      },
    });
  });

  it("두 공항의 옷차림을 비교한 갈아입기 안내를 만든다", async () => {
    const result = await lookupFlightOutfit(
      { flight: "KE17", date: "2026-10-31" },
      fakeDeps(),
    );

    expect(result).toMatchObject({
      tip: expect.stringContaining("방수되는 얇은 재킷"),
    });
    expect(result.status === "ok" && result.tip).toContain("ICN");
    expect(result.status === "ok" && result.tip).toContain("LAX");
  });
});

describe("예보가 없거나 실패한 경우", () => {
  it("예보 기간을 벗어난 날짜는 일정은 보여 주고 날씨는 unavailable로 돌려준다", async () => {
    const deps = fakeDeps({
      fetchHourlyForecast: vi.fn(async () => []),
    });

    const result = await lookupFlightOutfit(
      { flight: "KE17", date: "2026-10-31" },
      deps,
    );

    expect(result).toMatchObject({
      status: "ok",
      flight: { flightNumber: "KE17" },
      departure: { status: "unavailable" },
      arrival: { status: "unavailable" },
    });
    expect(result.status === "ok" && result.comparison).toBeUndefined();
    expect(result.status === "ok" && result.tip).toBeUndefined();
  });

  it("한쪽 공항 날씨 조회가 실패하면 성공한 쪽은 그대로 두고 차이는 숨긴다", async () => {
    const deps = fakeDeps({
      fetchHourlyForecast: vi.fn(async (_latitude: number, longitude: number) => {
        if (longitude < 0) throw new Error("timeout");
        return ICN_HOURS;
      }),
    });

    const result = await lookupFlightOutfit(
      { flight: "KE17", date: "2026-10-31" },
      deps,
    );

    expect(result).toMatchObject({
      status: "ok",
      departure: { status: "ok" },
      arrival: { status: "failed" },
    });
    expect(result.status === "ok" && result.comparison).toBeUndefined();
  });
});
