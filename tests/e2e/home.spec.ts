import { expect, test } from "@playwright/test";

test("homepage loads correctly", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Kronoma/i);
  await expect(
    page.getByRole("heading", { level: 1, name: /Track your hours\./i })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: /Simple time tracking for freelancers and teams\./i,
    })
  ).toBeVisible();
});
