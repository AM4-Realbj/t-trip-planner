import type { HourlyPoint, Weather, WeatherKind } from "./types";

const LABELS: Record<WeatherKind, string> = {
  clear: "맑음",
  cloudy: "구름 많음",
  fog: "안개",
  rain: "비",
  snow: "눈",
  thunder: "뇌우",
};

/** Open-Meteo가 쓰는 WMO 날씨 코드를 화면에 쓰는 여섯 가지 상태로 묶는다. */
function kindOf(code: number): WeatherKind {
  if (code <= 1) return "clear";
  if (code <= 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "thunder";
  return "cloudy";
}

export function toWeather(point: HourlyPoint): Weather {
  const kind = kindOf(point.weatherCode);
  return {
    kind,
    label: LABELS[kind],
    temperatureC: Math.round(point.temperatureC),
    apparentC: Math.round(point.apparentC),
    precipitationProbability: Math.round(point.precipitationProbability),
  };
}

/** 예정 시각을 포함하는 정시 예보. 예보 기간 밖이면 undefined. */
export function pickHour(points: HourlyPoint[], scheduledLocal: string) {
  const hour = `${scheduledLocal.slice(0, 13)}:00`;
  return points.find((point) => point.localTime === hour);
}
