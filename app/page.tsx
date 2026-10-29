import { Suspense } from "react";
import { LuggageIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { validateLookupInput } from "@/features/flight-outfit";
import {
  FlightResult,
  ResultSkeleton,
} from "@/features/flight-outfit/components/flight-result";
import { LookupForm } from "@/features/flight-outfit/components/lookup-form";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const flight = first(params.flight);
  const date = first(params.date);
  const submitted = flight !== undefined || date !== undefined;
  const input = { flight: flight ?? "", date: date ?? "" };
  const errors = submitted ? validateLookupInput(input, new Date()) : {};
  const valid = submitted && Object.keys(errors).length === 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-8 sm:py-12">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          공항 날씨와 옷차림
        </h1>
        <p className="text-muted-foreground">
          출발 날짜와 편명을 넣으면 출발·도착 공항의 날씨와 입을 옷을 알려드려요.
        </p>
      </div>

      <LookupForm
        defaultFlight={flight}
        defaultDate={date}
        errors={errors}
      />

      {!submitted ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-1.5 py-6 text-center">
            <LuggageIcon aria-hidden="true" className="size-8" />
            <strong className="font-semibold">아직 조회한 편명이 없어요</strong>
            <p className="text-sm text-muted-foreground">
              날짜와 편명을 입력하면 공항별 예보와 추천 옷이 이곳에 나타나요.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {valid ? (
        <Suspense key={`${date}|${flight}`} fallback={<ResultSkeleton />}>
          <FlightResult flight={input.flight} date={input.date} />
        </Suspense>
      ) : null}
    </main>
  );
}
