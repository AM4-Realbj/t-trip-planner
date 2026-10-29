import { expect, test } from "@playwright/test";

test("홈 화면이 열리고 조회 폼이 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("공항 날씨와 옷차림");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "공항 날씨와 옷차림",
  );
  await expect(page.getByLabel("편명")).toBeVisible();
});
