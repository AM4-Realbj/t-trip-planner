"use client";

import { useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import type { LookupErrors } from "../types";
import { dateOf } from "./format";

const MAX_FLIGHTS = 3;

type Props = {
  defaultFlights?: string[];
  defaultDate?: string;
  errors?: LookupErrors;
  /** 결과가 나온 뒤에는 입력 칸을 접고 조회 조건 요약만 보여 준다. */
  collapsed?: boolean;
};

export function LookupForm({
  defaultFlights = [],
  defaultDate,
  errors = {},
  collapsed = false,
}: Props) {
  const form = (
    <FormFields
      defaultFlights={defaultFlights}
      defaultDate={defaultDate}
      errors={errors}
    />
  );

  if (!collapsed) {
    return (
      <Card>
        <CardContent>{form}</CardContent>
      </Card>
    );
  }

  const summary = defaultFlights
    .map((f) => f.replace(/\s+/g, "").toUpperCase())
    .join(" → ");
  return (
    <Card>
      <CardContent>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
            <span className="text-sm font-medium">
              {defaultDate ? dateOf(`${defaultDate}T00:00`) : ""} · {summary}
            </span>
            <span className={buttonVariants({ variant: "outline", size: "sm" })}>
              다시 조회
            </span>
          </summary>
          <div className="pt-4">{form}</div>
        </details>
      </CardContent>
    </Card>
  );
}

type Row = { id: number; value: string };

/** 날짜(왼쪽)와 편명(오른쪽)을 GET으로 보내 주소에 조회 조건이 남게 한다. 편명 칸은 모두 `flight`로 전송된다. */
function FormFields({
  defaultFlights,
  defaultDate,
  errors,
}: {
  defaultFlights: string[];
  defaultDate?: string;
  errors: LookupErrors;
}) {
  const initial = defaultFlights.length > 0 ? defaultFlights : [""];
  const [rows, setRows] = useState<Row[]>(() =>
    initial.map((value, id) => ({ id, value })),
  );
  const [nextId, setNextId] = useState(initial.length);
  const [focusId, setFocusId] = useState<number | null>(null);
  const multi = rows.length > 1;

  return (
    <form action="/" method="get" noValidate>
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={errors.date ? true : undefined}>
            <FieldLabel htmlFor="date">출발 날짜</FieldLabel>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={defaultDate}
              aria-invalid={errors.date ? true : undefined}
              aria-describedby={errors.date ? "date-error" : undefined}
            />
            {errors.date ? (
              <FieldError id="date-error">{errors.date}</FieldError>
            ) : null}
          </Field>
          <Field data-invalid={errors.flight ? true : undefined}>
            <FieldLabel htmlFor="flight">편명</FieldLabel>
            <div className="flex flex-col gap-2">
              {rows.map((row, i) => (
                <div key={row.id} className="flex items-center gap-2">
                  {multi ? (
                    <span className="w-7 shrink-0 text-xs font-semibold text-muted-foreground">
                      {i + 1}편
                    </span>
                  ) : null}
                  <Input
                    id={i === 0 ? "flight" : undefined}
                    name="flight"
                    placeholder="예: KE17"
                    autoComplete="off"
                    value={row.value}
                    autoFocus={row.id === focusId}
                    aria-label={multi ? `${i + 1}편 편명` : undefined}
                    aria-invalid={errors.flight ? true : undefined}
                    aria-describedby={errors.flight ? "flight-error" : undefined}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r) =>
                          r.id === row.id ? { ...r, value: e.target.value } : r,
                        ),
                      )
                    }
                  />
                  {multi ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`${i + 1}편 삭제`}
                      onClick={() =>
                        setRows((prev) => prev.filter((r) => r.id !== row.id))
                      }
                    >
                      <XIcon />
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
            {errors.flight ? (
              <FieldError id="flight-error">{errors.flight}</FieldError>
            ) : null}
            {rows.length < MAX_FLIGHTS ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => {
                  setFocusId(nextId);
                  setRows((prev) => [...prev, { id: nextId, value: "" }]);
                  setNextId(nextId + 1);
                }}
              >
                <PlusIcon data-icon="inline-start" />
                환승편 추가
              </Button>
            ) : null}
          </Field>
        </div>
        <Button type="submit" size="lg" className="w-full">
          조회하기
        </Button>
      </FieldGroup>
    </form>
  );
}
