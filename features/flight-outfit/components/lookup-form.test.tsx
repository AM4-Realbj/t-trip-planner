import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LookupForm } from "./lookup-form";

const flightValues = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLInputElement>("input[name=flight]")].map(
    (i) => i.value,
  );

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
    render(<LookupForm defaultFlights={["KE17"]} defaultDate="2026-10-31" />);

    expect(screen.getByLabelText("편명")).toHaveValue("KE17");
    expect(screen.getByLabelText("출발 날짜")).toHaveValue("2026-10-31");
  });

  it("오류는 해당 입력 칸 아래에 표시하고 그 칸을 잘못된 값으로 표시한다", () => {
    render(
      <LookupForm
        defaultFlights={["K"]}
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
      <LookupForm collapsed defaultFlights={["KE17"]} defaultDate="2026-10-31" />,
    );

    const details = container.querySelector("details")!;
    expect(details).not.toHaveAttribute("open");
    expect(screen.getByText("10월 31일 (토) · KE17")).toBeInTheDocument();
    expect(screen.getByText("다시 조회")).toBeInTheDocument();
    expect(details.querySelector("form")).not.toBeNull();
  });

  it("편명이 여러 개면 요약에 모두 보여 주고, 다시 열면 칸들이 그대로 채워져 있다", () => {
    const { container } = render(
      <LookupForm
        collapsed
        defaultFlights={["KE17", "aa 1234"]}
        defaultDate="2026-10-31"
      />,
    );

    expect(screen.getByText("10월 31일 (토) · KE17 → AA1234")).toBeInTheDocument();
    expect(flightValues(container)).toEqual(["KE17", "aa 1234"]);
  });

  it("접지 않은 상태에서는 details 없이 입력 칸을 바로 보여 준다", () => {
    const { container } = render(<LookupForm />);

    expect(container.querySelector("details")).toBeNull();
  });
});

describe("환승편 칸", () => {
  it("편명 칸이 하나일 때는 번호와 삭제 버튼 없이 '환승편 추가' 버튼만 보인다", () => {
    render(<LookupForm />);

    expect(screen.getByRole("button", { name: "환승편 추가" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /삭제/ })).not.toBeInTheDocument();
  });

  it("'환승편 추가'를 누르면 번호가 붙은 편명 칸이 늘어나고 모두 같은 이름으로 전송된다", () => {
    const { container } = render(<LookupForm defaultFlights={["KE17"]} />);

    fireEvent.click(screen.getByRole("button", { name: "환승편 추가" }));

    expect(screen.getByLabelText("1편 편명")).toHaveValue("KE17");
    expect(screen.getByLabelText("2편 편명")).toHaveValue("");
    expect(flightValues(container)).toEqual(["KE17", ""]);
    expect(screen.getAllByRole("button", { name: /편 삭제/ })).toHaveLength(2);
  });

  it("칸을 지우면 남은 칸의 번호가 다시 매겨지고 하나만 남으면 번호가 사라진다", () => {
    const { container } = render(<LookupForm defaultFlights={["KE17", "AA1234"]} />);

    fireEvent.click(screen.getByRole("button", { name: "1편 삭제" }));

    expect(flightValues(container)).toEqual(["AA1234"]);
    expect(screen.getByLabelText("편명")).toHaveValue("AA1234");
    expect(screen.queryByRole("button", { name: /삭제/ })).not.toBeInTheDocument();
  });

  it("편명은 4칸까지만 늘릴 수 있다", () => {
    render(<LookupForm defaultFlights={["KE1", "KE2", "KE3", "KE4"]} />);

    expect(screen.queryByRole("button", { name: "환승편 추가" })).not.toBeInTheDocument();
  });
});
