import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import type { LookupErrors } from "../types";

type Props = {
  defaultFlight?: string;
  defaultDate?: string;
  errors?: LookupErrors;
};

/** 날짜(왼쪽)와 편명(오른쪽)을 GET으로 보내 주소에 조회 조건이 남게 한다. */
export function LookupForm({ defaultFlight, defaultDate, errors = {} }: Props) {
  return (
    <Card>
      <CardContent>
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
                  aria-describedby={errors.date ? "date-error" : "date-hint"}
                />
                {errors.date ? (
                  <FieldError id="date-error">{errors.date}</FieldError>
                ) : (
                  <FieldDescription id="date-hint">
                    출발 공항 현지 날짜예요.
                  </FieldDescription>
                )}
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
              날씨와 옷 보기
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
