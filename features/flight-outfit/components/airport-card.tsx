import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { AirportStop, Outfit, StopForecast, StopRole } from "../types";
import { dateOf, timeOf, zoneOf } from "./format";
import { BaseIcon, CarryIcon, OuterIcon, WeatherIcon } from "./outfit-icons";

type Props = {
  role: StopRole;
  stop: AirportStop;
  forecast: StopForecast;
  retryHref: string;
  /** 환승 공항: 앞 편이 도착하는 현지 시각 */
  arrivalLocal?: string;
  layoverMinutes?: number;
};

const DAY_WORD: Record<StopRole, string> = {
  출발: "출발일",
  환승: "탑승일",
  도착: "도착일",
};

function layoverText(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours ? `${hours}시간` : "", rest || !hours ? `${rest}분` : ""]
    .filter(Boolean)
    .join(" ");
}

export function AirportCard({
  role,
  stop,
  forecast,
  retryHref,
  arrivalLocal,
  layoverMinutes,
}: Props) {
  const times = arrivalLocal
    ? [
        { label: "도착", local: arrivalLocal },
        { label: "탑승", local: stop.scheduledLocal },
      ]
    : [{ label: undefined, local: stop.scheduledLocal }];
  const dates = [...new Set(times.map((t) => dateOf(t.local)))].join(" → ");
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
            {times.map((t) => (
              <span key={t.local} className="flex items-baseline gap-2">
                {t.label ? (
                  <span className="text-xs text-muted-foreground">{t.label}</span>
                ) : null}
                <span className="text-lg font-semibold">{timeOf(t.local)}</span>
              </span>
            ))}
            <span className="text-muted-foreground">{dates}</span>
            <span className="text-xs text-muted-foreground">
              현지 {zoneOf(stop.scheduledLocal, stop.timeZone)}
            </span>
          </div>
        </div>
        {layoverMinutes !== undefined ? (
          <div>
            <Badge variant="outline">환승 대기 {layoverText(layoverMinutes)}</Badge>
          </div>
        ) : null}
        <Separator />
        <ForecastBody
          forecast={forecast}
          day={DAY_WORD[role]}
          retryHref={retryHref}
        />
      </CardContent>
    </Card>
  );
}

function ForecastBody({
  forecast,
  day,
  retryHref,
}: {
  forecast: StopForecast;
  day: string;
  retryHref: string;
}) {
  if (forecast.status === "unavailable") {
    return (
      <div className="flex flex-col gap-1">
        <strong className="font-semibold">아직 예보가 없습니다</strong>
        <p className="text-sm text-muted-foreground">
          {day}이 16일 안으로 들어오면 날씨와 옷 추천을 볼 수 있어요. 그때
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
