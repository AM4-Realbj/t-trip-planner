import { describe, expect, it, vi } from "vitest";

import { fetchFlightFromAeroDataBox } from "./aerodatabox";

// 실제 RapidAPI 응답(KE17, 2026-10-31)에서 쓰는 필드만 남긴 표본
const KE17_RESPONSE = [
  {
    departure: {
      airport: {
        iata: "ICN",
        name: "Seoul Incheon",
        municipalityName: "Seoul",
        location: { lat: 37.4691, lon: 126.451 },
        timeZone: "Asia/Seoul",
      },
      scheduledTime: {
        utc: "2026-10-31 05:30Z",
        local: "2026-10-31 14:30+09:00",
      },
      terminal: "2",
    },
    arrival: {
      airport: {
        iata: "LAX",
        name: "Los Angeles",
        municipalityName: "Los Angeles",
        location: { lat: 33.9425, lon: -118.408 },
        timeZone: "America/Los_Angeles",
      },
      scheduledTime: {
        utc: "2026-10-31 16:30Z",
        local: "2026-10-31 09:30-07:00",
      },
      predictedTime: { local: "2026-10-31 10:13-07:00" },
      terminal: "B",
    },
    number: "KE 17",
    airline: { name: "Korean Air", iata: "KE" },
  },
];

function respond(status: number, body?: unknown) {
  return vi.fn(
    async () =>
      new Response(body === undefined ? null : JSON.stringify(body), { status }),
  );
}

describe("AeroDataBox 편명 조회", () => {
  it("편명과 날짜로 조회하고 공항별 현지 예정 시각을 돌려준다", async () => {
    const fetchMock = respond(200, KE17_RESPONSE);

    const flight = await fetchFlightFromAeroDataBox("KE17", "2026-10-31", {
      apiKey: "test-key",
      fetch: fetchMock,
    });

    expect(flight).toMatchObject({
      flightNumber: "KE17",
      airline: "Korean Air",
      departure: {
        iata: "ICN",
        municipality: "Seoul",
        terminal: "2",
        timeZone: "Asia/Seoul",
        latitude: 37.4691,
        longitude: 126.451,
        scheduledLocal: "2026-10-31T14:30",
      },
      arrival: {
        iata: "LAX",
        timeZone: "America/Los_Angeles",
        scheduledLocal: "2026-10-31T09:30",
      },
    });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      "https://aerodatabox.p.rapidapi.com/flights/number/KE17/2026-10-31",
    );
    expect(init.headers).toMatchObject({
      "x-rapidapi-key": "test-key",
      "x-rapidapi-host": "aerodatabox.p.rapidapi.com",
    });
  });

  it.each([[204], [404]])("HTTP %i이면 해당 편이 없는 것으로 본다", async (status) => {
    const flight = await fetchFlightFromAeroDataBox("XX999", "2026-10-31", {
      apiKey: "k",
      fetch: respond(status),
    });

    expect(flight).toBeNull();
  });

  it("빈 배열이면 해당 편이 없는 것으로 본다", async () => {
    const flight = await fetchFlightFromAeroDataBox("XX999", "2026-10-31", {
      apiKey: "k",
      fetch: respond(200, []),
    });

    expect(flight).toBeNull();
  });

  it.each([[402], [403], [429], [500]])(
    "HTTP %i는 조회 실패로 던진다",
    async (status) => {
      await expect(
        fetchFlightFromAeroDataBox("KE17", "2026-10-31", {
          apiKey: "k",
          fetch: respond(status, { message: "x" }),
        }),
      ).rejects.toThrow();
    },
  );

  it("API 키가 없으면 호출하지 않고 던진다", async () => {
    const fetchMock = respond(200, KE17_RESPONSE);

    await expect(
      fetchFlightFromAeroDataBox("KE17", "2026-10-31", {
        apiKey: undefined,
        fetch: fetchMock,
      }),
    ).rejects.toThrow(/AERODATABOX_API_KEY/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
