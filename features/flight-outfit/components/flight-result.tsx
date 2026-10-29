import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { lookupFlight } from "../index";
import { AirportCard } from "./airport-card";
import { WeatherDifference } from "./weather-difference";

type Props = { flight: string; date: string };

export function ResultSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2"
      aria-busy="true"
      aria-label="날씨와 옷을 조회하는 중"
    >
      {[0, 1].map((i) => (
        <Card key={i}>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-8 w-3/5" />
            <Skeleton className="h-14" />
            <Skeleton className="h-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** 조회 조건으로 서버에서 편명과 날씨를 가져와 결과 영역을 그린다. */
export async function FlightResult({ flight, date }: Props) {
  const result = await lookupFlight({ flight, date });
  const retryHref = `/?${new URLSearchParams({ date, flight })}`;

  if (result.status === "not-found") {
    return (
      <Alert>
        <AlertTitle>해당 날짜에 운항하는 편명을 찾지 못했어요</AlertTitle>
        <AlertDescription>
          편명과 날짜를 다시 확인해 주세요. 출발 날짜는 출발 공항 현지 날짜예요.
        </AlertDescription>
      </Alert>
    );
  }

  if (result.status === "flight-error" || result.status === "invalid") {
    return (
      <Alert variant="destructive">
        <AlertTitle>편명 정보를 가져오지 못했어요</AlertTitle>
        <AlertDescription>
          잠시 연결이 원활하지 않아요. 다시 시도해 주세요.
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

  const { departure, arrival } = result.flight;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-base font-semibold">
          {departure.iata} → {arrival.iata} · {result.flight.flightNumber}
        </h2>
        {result.flight.airline ? (
          <Badge variant="outline">{result.flight.airline}</Badge>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AirportCard
          role="출발"
          stop={departure}
          forecast={result.departure}
          retryHref={retryHref}
        />
        <AirportCard
          role="도착"
          stop={arrival}
          forecast={result.arrival}
          retryHref={retryHref}
        />
      </div>

      {result.tip ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              갈아입기
            </span>
            <p className="text-sm break-keep">{result.tip}</p>
          </CardContent>
        </Card>
      ) : null}

      {result.comparison ? (
        <details className="group flex flex-col gap-4">
          <summary
            className={buttonVariants({
              variant: "outline",
              className: "w-full cursor-pointer list-none [&::-webkit-details-marker]:hidden",
            })}
          >
            <span className="group-open:hidden">차이비교</span>
            <span className="hidden group-open:inline">차이비교 닫기</span>
          </summary>
          <div className="pt-4">
            <WeatherDifference
              from={departure.iata}
              to={arrival.iata}
              comparison={result.comparison}
            />
          </div>
        </details>
      ) : null}

      <p className="text-center text-xs text-muted-foreground">
        항공편 정보 제공: AeroDataBox · 날씨: Open-Meteo
      </p>
    </div>
  );
}
