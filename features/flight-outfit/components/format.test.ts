import { describe, expect, it } from "vitest";

import { dateOf, signed, timeOf, withRo, zoneOf } from "./format";

describe("표시 형식", () => {
  it("예정 시각 문자열에서 시각과 요일 붙은 날짜를 만든다", () => {
    expect(timeOf("2026-10-31T14:30")).toBe("14:30");
    expect(dateOf("2026-10-31T14:30")).toBe("10월 31일 (토)");
    expect(dateOf("2026-11-01T09:00")).toBe("11월 1일 (일)");
  });

  it("공항 현지 시간대 표기를 만든다", () => {
    expect(zoneOf("2026-10-31T09:30", "America/Los_Angeles")).toBe("PDT");
    expect(zoneOf("2026-10-31T14:30", "Asia/Seoul")).toBe("GMT+9");
  });

  it.each([
    ["비", "비로"],
    ["맑음", "맑음으로"],
    ["안개", "안개로"],
    ["눈", "눈으로"],
    ["뇌우", "뇌우로"],
  ])("'%s' 뒤에는 '%s'를 붙인다", (word, expected) => {
    expect(withRo(word)).toBe(expected);
  });

  it("차이 값에 부호를 붙인다", () => {
    expect(signed(4, "°")).toBe("+4°");
    expect(signed(-3, "°")).toBe("−3°");
    expect(signed(0, "%p")).toBe("±0%p");
  });
});
