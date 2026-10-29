import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Shirt,
  Sun,
  Umbrella,
  type LucideProps,
} from "lucide-react";

import type { CarryItem, Outfit, WeatherKind } from "../types";

const WEATHER_ICONS = {
  clear: Sun,
  cloudy: Cloud,
  fog: CloudFog,
  rain: CloudRain,
  snow: CloudSnow,
  thunder: CloudLightning,
} satisfies Record<WeatherKind, React.ComponentType<LucideProps>>;

export function WeatherIcon({
  kind,
  label,
  ...props
}: { kind: WeatherKind; label: string } & LucideProps) {
  const Icon = WEATHER_ICONS[kind];
  return <Icon role="img" aria-label={label} {...props} />;
}

function Jacket(props: LucideProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(props as React.SVGProps<SVGSVGElement>)}
    >
      <path d="M9 3 3 6l2 5 3-1v11h8V10l3 1 2-5-6-3" />
      <path d="m9 3 3 3 3-3M12 6v15" />
    </svg>
  );
}

function Coat(props: LucideProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(props as React.SVGProps<SVGSVGElement>)}
    >
      <path d="M9 2 3 5l2 5 3-1v13h8V9l3 1 2-5-6-3" />
      <path d="m9 2 3 4 3-4M12 6v16M9.5 12h.01M9.5 16h.01" />
    </svg>
  );
}

function Scarf(props: LucideProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(props as React.SVGProps<SVGSVGElement>)}
    >
      <path d="M6 4h12v5H6zM9 9v11h4V9" />
    </svg>
  );
}

export function OuterIcon({
  icon,
  ...props
}: { icon: Outfit["outerIcon"] } & LucideProps) {
  const Icon = icon === "coat" ? Coat : Jacket;
  return <Icon aria-hidden="true" {...props} />;
}

export function BaseIcon(props: LucideProps) {
  return <Shirt aria-hidden="true" {...props} />;
}

export function CarryIcon({
  item,
  ...props
}: { item: CarryItem } & LucideProps) {
  const Icon = item === "우산" ? Umbrella : Scarf;
  return <Icon aria-hidden="true" {...props} />;
}
