import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AirportStop, ItineraryStop } from "../types";
import { ItinerarySummary } from "./itinerary-summary";

function stop(iata: string, scheduledLocal: string): AirportStop {
  return {
    iata,
    name: iata,
    municipality: iata,
    timeZone: "UTC",
    latitude: 0,
    longitude: 0,
    scheduledLocal,
    scheduledUtc: `${scheduledLocal}Z`,
  };
}

const STOPS: ItineraryStop[] = [
  {
    role: "출발",
    stop: stop("ICN", "2026-11-01T14:30"),
    forecast: {
      status: "ok",
      weather: { kind: "rain", label: "비", temperatureC: 12, apparentC: 8, precipitationProbability: 34 },
      outfit: { outer: "방수되는 도톰한 재킷", outerIcon: "coat", outerShort: "방수 재킷", base: "긴팔 니트, 긴 바지", carry: ["우산"] },
    },
  },
  {
    role: "환승",
    stop: stop("LAX", "2026-11-01T14:45"),
    arrivalLocal: "2026-11-01T08:30",
    layoverMinutes: 375,
    forecast: {
      status: "ok",
      weather: { kind: "clear", label: "맑음", temperatureC: 21, apparentC: 19, precipitationProbability: 17 },
      outfit: { outer: "얇은 재킷이나 가디건", outerIcon: "jacket", outerShort: "얇은 재킷", base: "긴팔 티셔츠, 긴 바지", carry: [] },
    },
  },
  { role: "도착", stop: stop("LIH", "2026-11-01T18:36"), forecast: { status: "unavailable" } },
];

describe("공항별 한눈에 비교", () => {
  it("공항마다 코드, 시각, 날씨, 기온, 강수 확률, 추천 겉옷을 한 줄에 나란히 보여 준다", () => {
    render(<ItinerarySummary stops={STOPS} />);

    const region = screen.getByRole("region", { name: "공항별 한눈에 비교" });
    const columns = within(region).getAllByRole("listitem");
    expect(columns).toHaveLength(3);

    const first = within(columns[0]);
    expect(first.getByText("ICN")).toBeInTheDocument();
    expect(first.getByText("14:30")).toBeInTheDocument();
    expect(first.getByText("12°")).toBeInTheDocument();
    expect(first.getByText("비")).toBeInTheDocument();
    expect(first.getByText("강수 34%")).toBeInTheDocument();
    expect(first.getByText("방수 재킷")).toBeInTheDocument();
    expect(first.getByText("우산")).toBeInTheDocument();

    const second = within(columns[1]);
    expect(second.getByText("탑승 14:45")).toBeInTheDocument();
    expect(second.getByText("얇은 재킷")).toBeInTheDocument();
  });

  it("예보가 없는 공항은 그 칸만 '예보 없음'으로 표시한다", () => {
    render(<ItinerarySummary stops={STOPS} />);

    const columns = within(screen.getByRole("region", { name: "공항별 한눈에 비교" })).getAllByRole("listitem");
    expect(within(columns[2]).getByText("LIH")).toBeInTheDocument();
    expect(within(columns[2]).getByText("예보 없음")).toBeInTheDocument();
  });
});
