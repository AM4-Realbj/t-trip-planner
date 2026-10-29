import { ChevronDownIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { lookupFlight } from "../index";
import { AirportCard } from "./airport-card";
import { ItinerarySummary } from "./itinerary-summary";
import { WeatherDifference } from "./weather-difference";

type Props = { flights: string[]; date: string };

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

function retryLink(href: string) {
  return (
    <a
      href={href}
      className={buttonVariants({
        variant: "outline",
        size: "sm",
        className: "mt-2 w-fit",
      })}
    >
      다시 시도
    </a>
  );
}

/** 조회 조건으로 서버에서 편명과 날씨를 가져와 결과 영역을 그린다. */
export async function FlightResult({ flights, date }: Props) {
  const result = await lookupFlight({ flights, date });
  const query = new URLSearchParams({ date });
  flights.forEach((f) => query.append("flight", f));
  const retryHref = `/?${query}`;
  const normalized = flights.map((f) => f.replace(/\s+/g, "").toUpperCase());
  const multi = flights.length > 1;

  if (result.status === "not-found") {
    return (
      <Alert>
        <AlertTitle>
          {multi
            ? `${result.legIndex + 1}편 ${normalized[result.legIndex]}를 찾지 못했어요`
            : "해당 날짜에 운항하는 편명을 찾지 못했어요"}
        </AlertTitle>
        <AlertDescription>
          {multi
            ? "편명을 다시 확인해 주세요. 환승편은 앞 편이 도착한 날부터 3일 안에서 찾아요."
            : "편명과 날짜를 다시 확인해 주세요. 출발 날짜는 출발 공항 현지 날짜예요."}
        </AlertDescription>
      </Alert>
    );
  }

  if (result.status === "no-connection") {
    return (
      <Alert>
        <AlertTitle>
          {result.legIndex + 1}편 {normalized[result.legIndex]}이 앞 편보다 먼저 출발해요
        </AlertTitle>
        <AlertDescription>
          앞 편이 도착한 뒤 3일 안에 출발하는 편이 없어요. 편명 순서를 확인해 주세요.
        </AlertDescription>
      </Alert>
    );
  }

  if (result.status === "airport-mismatch") {
    return (
      <Alert>
        <AlertTitle>
          {result.legIndex + 1}편의 출발 공항({result.to})이 앞 편의 도착 공항(
          {result.from})과 달라요
        </AlertTitle>
        <AlertDescription>
          환승하는 공항이 같은 편명끼리 순서대로 입력해 주세요.
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
          {retryLink(retryHref)}
        </AlertDescription>
      </Alert>
    );
  }

  const { legs, stops } = result;
  const airlines = [...new Set(legs.flatMap((l) => (l.airline ? [l.airline] : [])))];
  const stacked = stops.length > 2;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-base font-semibold">
          {stops.map((s) => s.stop.iata).join(" → ")} ·{" "}
          {legs.map((l) => l.flightNumber).join(" · ")}
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {airlines.map((airline) => (
            <Badge key={airline} variant="outline">
              {airline}
            </Badge>
          ))}
        </div>
      </div>

      {stacked ? <ItinerarySummary stops={stops} /> : null}

      <div className={stacked ? "flex flex-col" : "grid gap-4 sm:grid-cols-2"}>
        {stops.map((stop, i) => (
          <div key={`${stop.role}-${i}`} className="contents">
            <AirportCard
              role={stop.role}
              stop={stop.stop}
              forecast={stop.forecast}
              retryHref={retryHref}
              arrivalLocal={stop.arrivalLocal}
              layoverMinutes={stop.layoverMinutes}
            />
            {stacked && legs[i] ? (
              <div className="ml-6 flex items-center gap-2 border-l-2 border-dashed py-3 pl-4 text-sm text-muted-foreground">
                <Badge variant="secondary">{legs[i].flightNumber}</Badge>
                {legs[i].airline}
                <ChevronDownIcon aria-hidden="true" className="size-4" />
              </div>
            ) : null}
          </div>
        ))}
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

      {result.comparisons.length > 0 ? (
        <details className="group flex flex-col gap-4">
          <summary
            className={buttonVariants({
              variant: "outline",
              className:
                "w-full cursor-pointer list-none [&::-webkit-details-marker]:hidden",
            })}
          >
            <span className="group-open:hidden">차이비교</span>
            <span className="hidden group-open:inline">차이비교 닫기</span>
          </summary>
          <div className="flex flex-col gap-4 pt-4">
            {result.comparisons.map((pair) => (
              <WeatherDifference
                key={`${pair.from}-${pair.to}`}
                from={pair.from}
                to={pair.to}
                comparison={pair.comparison}
              />
            ))}
          </div>
        </details>
      ) : null}

      <p className="text-center text-xs text-muted-foreground">
        항공편 정보 제공: AeroDataBox · 날씨: Open-Meteo
      </p>
    </div>
  );
}
