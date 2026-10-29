import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { AirportStop, Outfit, StopForecast } from "../types";
import { dateOf, timeOf, zoneOf } from "./format";
import { BaseIcon, CarryIcon, OuterIcon, WeatherIcon } from "./outfit-icons";

type Props = {
  role: "출발" | "도착";
  stop: AirportStop;
  forecast: StopForecast;
  retryHref: string;
};

export function AirportCard({ role, stop, forecast, retryHref }: Props) {
  return (
    <Card data-airport-role={role}>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">{role}</span>
            <span className="text-3xl leading-tight font-semibold tracking-wide">
              {stop.iata}
            </span>
            <span className="text-sm text-muted-foreground">
              {stop.name}
              {stop.terminal ? ` · T${stop.terminal}` : ""}
            </span>
          </div>
          <div className="flex flex-col items-end text-sm">
            <span className="text-lg font-semibold">
              {timeOf(stop.scheduledLocal)}
            </span>
            <span className="text-muted-foreground">
              {dateOf(stop.scheduledLocal)}
            </span>
            <span className="text-xs text-muted-foreground">
              현지 {zoneOf(stop.scheduledLocal, stop.timeZone)}
            </span>
          </div>
        </div>
        <Separator />
        <ForecastBody forecast={forecast} role={role} retryHref={retryHref} />
      </CardContent>
    </Card>
  );
}

function ForecastBody({
  forecast,
  role,
  retryHref,
}: {
  forecast: StopForecast;
  role: string;
  retryHref: string;
}) {
  if (forecast.status === "unavailable") {
    return (
      <div className="flex flex-col gap-1">
        <strong className="font-semibold">아직 예보가 없습니다</strong>
        <p className="text-sm text-muted-foreground">
          {role}일이 16일 안으로 들어오면 날씨와 옷 추천을 볼 수 있어요. 그때
          다시 조회해 주세요.
        </p>
      </div>
    );
  }

  if (forecast.status === "failed") {
    return (
      <Alert variant="destructive">
        <AlertTitle>이 공항 날씨를 가져오지 못했어요</AlertTitle>
        <AlertDescription>
          다른 공항 정보는 그대로 볼 수 있어요.
          <a
            href={retryHref}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "mt-2 w-fit",
            })}
          >
            다시 시도
          </a>
        </AlertDescription>
      </Alert>
    );
  }

  const { weather, outfit } = forecast;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <WeatherIcon
          kind={weather.kind}
          label={weather.label}
          className="size-11 shrink-0"
          strokeWidth={1.6}
        />
        <span className="text-4xl leading-none font-semibold">
          {weather.temperatureC}°
        </span>
        <div className="flex flex-col text-sm text-muted-foreground">
          <b className="font-medium text-foreground">{weather.label}</b>
          <span>
            체감 {weather.apparentC}° · 강수 확률 {weather.precipitationProbability}%
          </span>
        </div>
      </div>
      <OutfitList outfit={outfit} />
    </div>
  );
}

function OutfitList({ outfit }: { outfit: Outfit }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-muted-foreground">추천 옷</span>
      <ul className="flex flex-col gap-3">
        <li className="flex items-center gap-3 text-base">
          <OuterIcon icon={outfit.outerIcon} className="size-7 shrink-0" />
          <span>{outfit.outer}</span>
        </li>
        <li className="flex items-center gap-3 text-base">
          <BaseIcon className="size-7 shrink-0" />
          <span>{outfit.base}</span>
        </li>
      </ul>
      <div className="flex flex-wrap gap-1.5">
        {outfit.carry.length > 0 ? (
          outfit.carry.map((item) => (
            <Badge key={item} variant="secondary" className="h-7 px-3 text-sm [&>svg]:size-4!">
              <CarryIcon item={item} />
              {item}
            </Badge>
          ))
        ) : (
          <Badge variant="secondary" className="h-7 px-3 text-sm">지참 물품 없음</Badge>
        )}
      </div>
    </div>
  );
}
