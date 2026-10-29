import type { AirportComparison, Weather } from "./types";

const STRONG_PRECIPITATION_POINTS = 30;

export function compareWeather(from: Weather, to: Weather): AirportComparison {
  const changed = from.kind !== to.kind;
  const deltaPoints = to.precipitationProbability - from.precipitationProbability;
  return {
    condition: { from, to, changed, emphasis: changed ? "strong" : "normal" },
    temperature: {
      fromC: from.temperatureC,
      toC: to.temperatureC,
      deltaC: to.temperatureC - from.temperatureC,
    },
    precipitation: {
      fromPercent: from.precipitationProbability,
      toPercent: to.precipitationProbability,
      deltaPoints,
      emphasis:
        Math.abs(deltaPoints) >= STRONG_PRECIPITATION_POINTS
          ? "strong"
          : "normal",
    },
  };
}
