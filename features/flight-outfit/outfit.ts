import type { CarryItem, ItineraryStop, Outfit, Weather } from "./types";

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

/** 일정의 모든 공항 겉옷을 이어서 기내에서 갈아입는 방법을 한 단락으로 안내한다. 날씨가 모두 있을 때만 쓴다. */
export function changeTip(stops: ItineraryStop[]) {
  const ready = stops.flatMap((s) =>
    s.forecast.status === "ok"
      ? [{ role: s.role, iata: s.stop.iata, weather: s.forecast.weather, outfit: s.forecast.outfit }]
      : [],
  );
  const scope = ready.length === 2 ? "두 공항" : "모든 공항";
  if (ready.every((s) => s.outfit.outer === ready[0].outfit.outer)) {
    return `${scope === "두 공항" ? "두 공항 모두" : "모든 공항에서"} ${ready[0].outfit.outer} 차림이 알맞아요. 겉옷을 벗고 입는 것으로 기내 온도에 맞춰 조절하세요.`;
  }
  const parts = ready.map((s, i) => {
    const lead = `${s.role} 공항(${s.iata})은 체감 ${s.weather.apparentC}°라 ${s.outfit.outer}`;
    if (i === ready.length - 1) return `${lead} 차림이 좋아요`;
    return i === 0 ? `${lead} 차림으로 나서고` : `${lead} 차림으로 갈아입고`;
  });
  return `${parts.join(", ")}. 겉옷만 벗고 입는 것으로 기내 온도와 ${scope} 날씨에 맞춰 조절하세요.`;
}
