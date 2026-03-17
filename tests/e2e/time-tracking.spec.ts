import { expect, test } from "@playwright/test";

import {
  createTestEmail,
  dismissProfilePromptIfPresent,
  loginWithMagicLink,
} from "./utils/auth";

async function getSessionStatus(page: import("@playwright/test").Page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/work-sessions", { cache: "no-store" });
    const payload = await response.json();
    return payload.session?.status ?? null;
  });
}

test("time tracking core flow works", async ({ page, request }, testInfo) => {
  await loginWithMagicLink(page, request, createTestEmail(testInfo.title));

  await page.goto("/dashboard");
  await dismissProfilePromptIfPresent(page);

  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
  await page.getByRole("button", { name: "Start" }).click();
  await expect.poll(async () => getSessionStatus(page)).toBe("RUNNING");
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();

  await page.getByRole("button", { name: "Pause" }).click();
  await expect.poll(async () => getSessionStatus(page)).toBe("PAUSED");
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();

  await page.getByRole("button", { name: "Resume" }).click();
  await expect.poll(async () => getSessionStatus(page)).toBe("RUNNING");
  await expect(page.getByRole("button", { name: "Finish" })).toBeVisible();

  await page.getByRole("button", { name: "Finish" }).click();
  await expect.poll(async () => getSessionStatus(page)).toBe(null);
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
});

test("time tracking session persists after refresh", async ({
  page,
  request,
}, testInfo) => {
  await loginWithMagicLink(page, request, createTestEmail(testInfo.title));

  await page.goto("/dashboard");
  await dismissProfilePromptIfPresent(page);

  await page.getByRole("button", { name: "Start" }).click();
  await expect.poll(async () => getSessionStatus(page)).toBe("RUNNING");

  await page.reload();
  await expect.poll(async () => getSessionStatus(page)).toBe("RUNNING");
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();

  await page.getByRole("button", { name: "Finish" }).click();
  await expect.poll(async () => getSessionStatus(page)).toBe(null);
});
