import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LookupForm } from "./lookup-form";

describe("조회 입력 폼", () => {
  it("출발 날짜가 왼쪽(앞), 편명이 오른쪽(뒤)에 놓이고 GET으로 조회한다", () => {
    const { container } = render(<LookupForm />);

    const inputs = [...container.querySelectorAll("input")].map((i) => i.name);
    expect(inputs).toEqual(["date", "flight"]);
    const form = container.querySelector("form")!;
    expect(form).toHaveAttribute("method", "get");
    expect(screen.getByRole("button", { name: "조회하기" })).toBeInTheDocument();
  });

  it("이전 조회 조건을 칸에 채워 둔다", () => {
    render(<LookupForm defaultFlight="KE17" defaultDate="2026-10-31" />);

    expect(screen.getByLabelText("편명")).toHaveValue("KE17");
    expect(screen.getByLabelText("출발 날짜")).toHaveValue("2026-10-31");
  });

  it("오류는 해당 입력 칸 아래에 표시하고 그 칸을 잘못된 값으로 표시한다", () => {
    render(
      <LookupForm
        defaultFlight="K"
        errors={{ flight: "편명 형식이 맞지 않아요. 항공사 코드 2자와 숫자로 입력해 주세요." }}
      />,
    );

    expect(screen.getByLabelText("편명")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("편명")).toHaveAccessibleDescription(
      "편명 형식이 맞지 않아요. 항공사 코드 2자와 숫자로 입력해 주세요.",
    );
    expect(screen.getByLabelText("출발 날짜")).not.toHaveAttribute("aria-invalid");
  });

  it("결과가 나온 뒤에는 입력 칸을 접고 조회 조건 요약과 '다시 조회' 버튼만 먼저 보여 준다", () => {
    const { container } = render(
      <LookupForm collapsed defaultFlight="KE17" defaultDate="2026-10-31" />,
    );

    const details = container.querySelector("details")!;
    expect(details).not.toHaveAttribute("open");
    expect(screen.getByText("10월 31일 (토) · KE17")).toBeInTheDocument();
    expect(screen.getByText("다시 조회")).toBeInTheDocument();
    expect(details.querySelector("form")).not.toBeNull();
  });

  it("접지 않은 상태에서는 details 없이 입력 칸을 바로 보여 준다", () => {
    const { container } = render(<LookupForm />);

    expect(container.querySelector("details")).toBeNull();
  });
});
