const WEEKDAYS = "일월화수목금토";

/** `2026-10-31T14:30` → `14:30` */
export function timeOf(scheduledLocal: string) {
  return scheduledLocal.slice(11, 16);
}

/** `2026-10-31T14:30` → `10월 31일 (토)` */
export function dateOf(scheduledLocal: string) {
  const [year, month, day] = scheduledLocal.slice(0, 10).split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${month}월 ${day}일 (${weekday})`;
}

/** 공항 현지 시간대 표기. 예: `GMT+9`, `PDT` */
export function zoneOf(scheduledLocal: string, timeZone: string) {
  const [year, month, day] = scheduledLocal.slice(0, 10).split("-").map(Number);
  const hour = Number(scheduledLocal.slice(11, 13));
  const instant = new Date(Date.UTC(year, month - 1, day, hour));
  return (
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
      .formatToParts(instant)
      .find((part) => part.type === "timeZoneName")?.value ?? timeZone
  );
}

/** 받침 유무에 따라 "로"와 "으로"를 고른다. ㄹ 받침은 "로"다. */
export function withRo(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const batchim = code >= 0 && code <= 11171 ? code % 28 : 0;
  return batchim === 0 || batchim === 8 ? `${word}로` : `${word}으로`;
}

export function signed(value: number, unit: string) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "±";
  return `${sign}${Math.abs(value)}${unit}`;
}
