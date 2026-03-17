import { expect, test } from "@playwright/test";

import {
  createTestEmail,
  dismissProfilePromptIfPresent,
  loginWithMagicLink,
} from "./utils/auth";

test("settings form saves correctly", async ({ page, request }, testInfo) => {
  await loginWithMagicLink(page, request, createTestEmail(testInfo.title));

  const displayName = `Playwright User ${Date.now()}`;

  await page.goto("/dashboard/settings");
  await dismissProfilePromptIfPresent(page);
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  await page.getByLabel("Display name").fill(displayName);
  await page.getByLabel("Hourly rate").fill("150");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByText("Settings updated")).toBeVisible();

  await page.reload();

  await expect(page.getByLabel("Display name")).toHaveValue(displayName);
  await expect(page.getByLabel("Hourly rate")).toHaveValue("150");
});

test("business profile prompt works and disappears after completion", async ({
  page,
  request,
}, testInfo) => {
  await loginWithMagicLink(page, request, createTestEmail(testInfo.title));

  await page.goto("/dashboard");

  const prompt = page.getByRole("dialog", { name: "Complete your profile" });
  await expect(prompt).toBeVisible();
  await prompt.getByRole("button", { name: "Complete my profile" }).click();

  await expect(page).toHaveURL("/dashboard/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.getByLabel("Company name").fill("Acme Studio");
  await page.getByLabel("Address").fill("1 Market Street");
  await page.getByLabel("City").fill("Zurich");
  await page.getByLabel("Postal code").fill("8001");
  await page.getByLabel("Country").fill("CH");
  await page.getByLabel("Email").fill("billing@acme.test");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByText("Business profile saved")).toBeVisible();

  await page.goto("/dashboard");
  await expect(
    page.getByRole("dialog", { name: "Complete your profile" })
  ).toHaveCount(0);
});
