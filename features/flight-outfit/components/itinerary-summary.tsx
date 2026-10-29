import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import type { ItineraryStop } from "../types";
import { timeOf } from "./format";
import { BaseIcon, CarryIcon, OuterIcon, WeatherIcon } from "./outfit-icons";

/** 환승이 있을 때 모든 공항의 날씨와 추천 옷을 스크롤 없이 나란히 견주어 보게 한다. */
export function ItinerarySummary({ stops }: { stops: ItineraryStop[] }) {
  return (
    <Card role="region" aria-label="공항별 한눈에 비교">
      <CardContent className="flex flex-col gap-3">
        <span className="text-xs font-semibold text-muted-foreground">
          공항별 한눈에 비교
        </span>
        <ul className="grid auto-cols-[minmax(6.5rem,1fr)] grid-flow-col overflow-x-auto">
          {stops.map((s, i) => (
            <li
              key={`${s.role}-${i}`}
              className="flex flex-col items-center gap-2 border-l px-2 text-center first:border-l-0"
            >
              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground">{s.role}</span>
                <span className="text-lg leading-tight font-semibold tracking-wide">
                  {s.stop.iata}
                </span>
                <span className="text-xs text-muted-foreground">
                  {s.role === "환승" ? "탑승 " : ""}
                  {timeOf(s.stop.scheduledLocal)}
                </span>
              </div>
              <Column forecast={s.forecast} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function Column({ forecast }: { forecast: ItineraryStop["forecast"] }) {
  if (forecast.status !== "ok") {
    return (
      <span className="py-6 text-sm text-muted-foreground">
        {forecast.status === "unavailable" ? "예보 없음" : "날씨 오류"}
      </span>
    );
  }

  const { weather, outfit } = forecast;
  return (
    <>
      <div className="flex flex-col items-center gap-0.5">
        <WeatherIcon
          kind={weather.kind}
          label={weather.label}
          className="size-9"
          strokeWidth={1.6}
        />
        <b className="text-2xl leading-none font-semibold">
          {weather.temperatureC}°
        </b>
        <span className="text-sm">{weather.label}</span>
        <span className="text-xs text-muted-foreground">
          강수 {weather.precipitationProbability}%
        </span>
      </div>
      <div className="flex w-full flex-col items-center gap-1.5 border-t pt-2">
        <OuterIcon icon={outfit.outerIcon} className="size-7" />
        <span className="text-sm font-medium">{outfit.outerShort}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <BaseIcon className="size-4 shrink-0" />
          {outfit.base}
        </span>
        <div className="flex flex-wrap justify-center gap-1">
          {outfit.carry.map((item) => (
            <Badge key={item} variant="secondary">
              <CarryIcon item={item} />
              {item}
            </Badge>
          ))}
        </div>
      </div>
    </>
  );
}
