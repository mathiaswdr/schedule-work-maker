import { expect, test } from "@playwright/test";

import {
  createTestEmail,
  dismissProfilePromptIfPresent,
  loginWithMagicLink,
} from "./utils/auth";

test("logout works", async ({ page, request }, testInfo) => {
  await loginWithMagicLink(page, request, createTestEmail(testInfo.title));

  await page.goto("/dashboard");
  await dismissProfilePromptIfPresent(page);
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
});
