import type { CarryItem, Outfit, Weather } from "./types";

type Tier = {
  minApparentC: number;
  dry: { outer: string; short: string };
  wet: { outer: string; short: string };
  icon: Outfit["outerIcon"];
  base: string;
};

const TIERS: Tier[] = [
  {
    minApparentC: 27,
    dry: { outer: "기내용 얇은 가디건만 챙기세요", short: "얇은 가디건" },
    wet: { outer: "방수되는 얇은 재킷", short: "방수 재킷" },
    icon: "jacket",
    base: "반팔 티셔츠, 얇은 바지",
  },
  {
    minApparentC: 20,
    dry: { outer: "가벼운 가디건 (벗어도 돼요)", short: "가벼운 가디건" },
    wet: { outer: "방수되는 얇은 재킷", short: "방수 재킷" },
    icon: "jacket",
    base: "얇은 긴팔 티셔츠, 긴 바지",
  },
  {
    minApparentC: 12,
    dry: { outer: "얇은 재킷이나 가디건", short: "얇은 재킷" },
    wet: { outer: "방수되는 얇은 재킷", short: "방수 재킷" },
    icon: "jacket",
    base: "긴팔 티셔츠, 긴 바지",
  },
  {
    minApparentC: 5,
    dry: { outer: "도톰한 재킷이나 코트", short: "도톰한 코트" },
    wet: { outer: "방수되는 도톰한 재킷", short: "방수 재킷" },
    icon: "coat",
    base: "긴팔 니트, 긴 바지",
  },
  {
    minApparentC: -Infinity,
    dry: { outer: "두꺼운 패딩이나 코트", short: "두꺼운 코트" },
    wet: { outer: "방수되는 두꺼운 코트", short: "방수 코트" },
    icon: "coat",
    base: "니트와 기모 바지",
  },
];

const WET_KINDS: Weather["kind"][] = ["rain", "thunder", "snow"];
const WET_PROBABILITY = 50;
const FREEZING_APPARENT_C = 0;

export function recommendOutfit(weather: Weather): Outfit {
  const tier = TIERS.find((t) => weather.apparentC >= t.minApparentC)!;
  const wet =
    weather.precipitationProbability >= WET_PROBABILITY ||
    WET_KINDS.includes(weather.kind);
  const pick = wet ? tier.wet : tier.dry;

  const carry: CarryItem[] = [];
  if (wet) carry.push("우산");
  if (weather.apparentC < FREEZING_APPARENT_C) carry.push("목도리·장갑");

  return {
    outer: pick.outer,
    outerIcon: tier.icon,
    outerShort: pick.short,
    base: tier.base,
    carry,
  };
}

/** 두 공항의 겉옷을 견주어 기내에서 갈아입는 방법을 한 단락으로 안내한다. */
export function changeTip(
  departure: { iata: string; weather: Weather; outfit: Outfit },
  arrival: { iata: string; weather: Weather; outfit: Outfit },
) {
  if (departure.outfit.outer === arrival.outfit.outer) {
    return `두 공항 모두 ${departure.outfit.outer} 차림이 알맞아요. 겉옷을 벗고 입는 것으로 기내 온도에 맞춰 조절하세요.`;
  }
  return `출발 공항(${departure.iata})은 체감 ${departure.weather.apparentC}°라 ${departure.outfit.outer} 차림으로 나서고, 도착 공항(${arrival.iata})은 체감 ${arrival.weather.apparentC}°라 ${arrival.outfit.outer} 차림이 좋아요. 겉옷만 벗고 입는 것으로 기내 온도와 두 공항 날씨에 맞춰 조절하세요.`;
}
