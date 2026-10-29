import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AirportStop, StopForecast } from "../types";
import { AirportCard } from "./airport-card";

const LAX: AirportStop = {
  iata: "LAX",
  name: "Los Angeles",
  municipality: "Los Angeles",
  terminal: "B",
  timeZone: "America/Los_Angeles",
  latitude: 33.9425,
  longitude: -118.408,
  scheduledLocal: "2026-10-31T09:30",
};

function renderCard(forecast: StopForecast) {
  return render(
    <AirportCard
      role="도착"
      stop={LAX}
      forecast={forecast}
      retryHref="/?date=2026-10-31&flight=KE17"
    />,
  );
}

describe("공항 카드", () => {
  it("공항 코드와 공항 현지 예정 시각, 날짜, 시간대를 보여 준다", () => {
    renderCard({ status: "unavailable" });

    expect(screen.getByText("LAX")).toBeInTheDocument();
    expect(screen.getByText("09:30")).toBeInTheDocument();
    expect(screen.getByText("10월 31일 (토)")).toBeInTheDocument();
    expect(screen.getByText("현지 PDT")).toBeInTheDocument();
  });

  it("예보가 있으면 날씨 아이콘과 기온, 추천 옷과 지참 물품을 보여 준다", () => {
    renderCard({
      status: "ok",
      weather: {
        kind: "rain",
        label: "비",
        temperatureC: 18,
        apparentC: 17,
        precipitationProbability: 60,
      },
      outfit: {
        outer: "방수되는 얇은 재킷",
        outerIcon: "jacket",
        outerShort: "방수 재킷",
        base: "긴팔 티셔츠, 긴 바지",
        carry: ["우산"],
      },
    });

    expect(screen.getByRole("img", { name: "비" })).toBeInTheDocument();
    expect(screen.getByText("18°")).toBeInTheDocument();
    expect(screen.getByText("체감 17° · 강수 확률 60%")).toBeInTheDocument();
    expect(screen.getByText("방수되는 얇은 재킷")).toBeInTheDocument();
    expect(screen.getByText("우산")).toBeInTheDocument();
  });

  it("예보 기간 밖이면 일정은 두고 '아직 예보가 없습니다'를 알린다", () => {
    renderCard({ status: "unavailable" });

    expect(screen.getByText("아직 예보가 없습니다")).toBeInTheDocument();
    expect(screen.queryByText("추천 옷")).not.toBeInTheDocument();
  });

  it("날씨 조회가 실패하면 오류와 다시 시도 링크를 보여 준다", () => {
    renderCard({ status: "failed" });

    expect(screen.getByText("이 공항 날씨를 가져오지 못했어요")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "다시 시도" })).toHaveAttribute(
      "href",
      "/?date=2026-10-31&flight=KE17",
    );
  });
});
