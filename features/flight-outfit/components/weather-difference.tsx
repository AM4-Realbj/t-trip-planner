import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { AirportComparison } from "../types";
import { signed, withRo } from "./format";
import { WeatherIcon } from "./outfit-icons";

type Props = {
  from: string;
  to: string;
  comparison: AirportComparison;
};

export function WeatherDifference({ from, to, comparison }: Props) {
  const { condition, temperature, precipitation } = comparison;
  const temperatureNote =
    temperature.deltaC > 0
      ? `${signed(temperature.deltaC, "°")} 더 따뜻함`
      : temperature.deltaC < 0
        ? `${signed(temperature.deltaC, "°")} 더 추워짐`
        : "기온 같음";

  return (
    <Card aria-label="공항 간 날씨 차이">
      <CardContent className="flex flex-col">
        <span className="pb-1 text-xs font-semibold text-muted-foreground">
          {from} → {to} 날씨 차이
        </span>

        <Row label="날씨">
          <span className="flex flex-wrap items-center gap-2 font-medium">
            <WeatherIcon
              kind={condition.from.kind}
              label={condition.from.label}
              className="size-5"
              strokeWidth={1.6}
            />
            {condition.from.label}
            <span aria-hidden="true" className="text-muted-foreground">
              →
            </span>
            <WeatherIcon
              kind={condition.to.kind}
              label={condition.to.label}
              className="size-5"
              strokeWidth={1.6}
            />
            {condition.to.label}
          </span>
          <Badge variant={condition.emphasis === "strong" ? "default" : "secondary"}>
            {condition.changed ? `${withRo(condition.to.label)} 바뀜` : "같음"}
          </Badge>
        </Row>

        <Row label="기온">
          <span className="font-medium">
            {temperature.fromC}° <span aria-hidden="true" className="text-muted-foreground">→</span>{" "}
            {temperature.toC}°
          </span>
          <Badge variant="secondary">{temperatureNote}</Badge>
        </Row>

        <Row label="강수 확률">
          <div className="flex flex-col gap-1.5">
            <span className="font-medium">
              {precipitation.fromPercent}%{" "}
              <span aria-hidden="true" className="text-muted-foreground">→</span>{" "}
              {precipitation.toPercent}%
            </span>
            <Bar percent={precipitation.fromPercent} muted />
            <Bar percent={precipitation.toPercent} />
          </div>
          <Badge
            variant={precipitation.emphasis === "strong" ? "default" : "secondary"}
          >
            {signed(precipitation.deltaPoints, "%p")}
          </Badge>
        </Row>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: [React.ReactNode, React.ReactNode];
}) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 border-t py-2.5 text-sm first-of-type:border-t-0">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children[0]}
      {children[1]}
    </div>
  );
}

function Bar({ percent, muted = false }: { percent: number; muted?: boolean }) {
  return (
    <div aria-hidden="true" className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full", muted ? "bg-muted-foreground/50" : "bg-primary")}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
