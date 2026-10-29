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

type Props = {
  defaultFlight?: string;
  defaultDate?: string;
  errors?: LookupErrors;
  /** 결과가 나온 뒤에는 입력 칸을 접고 조회 조건 요약만 보여 준다. */
  collapsed?: boolean;
};

export function LookupForm({
  defaultFlight,
  defaultDate,
  errors = {},
  collapsed = false,
}: Props) {
  const form = (
    <FormFields
      defaultFlight={defaultFlight}
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

  return (
    <Card>
      <CardContent>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
            <span className="text-sm font-medium">
              {defaultDate ? dateOf(`${defaultDate}T00:00`) : ""} ·{" "}
              {defaultFlight?.replace(/\s+/g, "").toUpperCase()}
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

/** 날짜(왼쪽)와 편명(오른쪽)을 GET으로 보내 주소에 조회 조건이 남게 한다. */
function FormFields({
  defaultFlight,
  defaultDate,
  errors,
}: {
  defaultFlight?: string;
  defaultDate?: string;
  errors: LookupErrors;
}) {
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
            <Input
              id="flight"
              name="flight"
              placeholder="예: KE17"
              autoComplete="off"
              defaultValue={defaultFlight}
              aria-invalid={errors.flight ? true : undefined}
              aria-describedby={errors.flight ? "flight-error" : undefined}
            />
            {errors.flight ? (
              <FieldError id="flight-error">{errors.flight}</FieldError>
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
