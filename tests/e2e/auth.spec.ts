import { expect, test } from "@playwright/test";

import { createTestEmail, loginWithMagicLink } from "./utils/auth";

test("login flow works with a magic link", async ({ page, request }, testInfo) => {
  const email = createTestEmail(testInfo.title);

  await loginWithMagicLink(page, request, email);

  await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  await expect(page).toHaveURL("/");
});

test("protected settings page redirects unauthenticated users", async ({ page }) => {
  await page.goto("/dashboard/settings");

  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { level: 1, name: /Track your hours\./i })
  ).toBeVisible();
});

test("protected subscription page redirects unauthenticated users", async ({ page }) => {
  await page.goto("/dashboard/subscription");

  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { level: 1, name: /Track your hours\./i })
  ).toBeVisible();
});
