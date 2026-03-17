import { expect, type APIRequestContext, type Page } from "@playwright/test";

const MAGIC_LINK_TIMEOUT_MS = 15_000;
const MAGIC_LINK_POLL_INTERVAL_MS = 500;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "user";

export const createTestEmail = (seed: string) =>
  `e2e+${slugify(seed)}-${Date.now()}@temiqo.local`;

async function waitForMagicLink(
  request: APIRequestContext,
  email: string
): Promise<string> {
  const deadline = Date.now() + MAGIC_LINK_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const response = await request.get(
      `/api/test/auth-link?email=${encodeURIComponent(email)}`,
      { failOnStatusCode: false }
    );

    if (response.ok()) {
      const payload = (await response.json()) as { url?: string };

      if (payload.url) {
        return payload.url;
      }
    }

    await new Promise((resolve) =>
      setTimeout(resolve, MAGIC_LINK_POLL_INTERVAL_MS)
    );
  }

  throw new Error(`Timed out waiting for a magic link for ${email}.`);
}

export async function loginWithMagicLink(
  page: Page,
  request: APIRequestContext,
  email = createTestEmail("user")
) {
  await page.goto("/auth/login");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("button", { name: "Send magic link" }).click();

  const magicLink = await waitForMagicLink(request, email);
  await page.goto(magicLink, { waitUntil: "commit" });
  await page.waitForURL((url) => !url.pathname.startsWith("/api/auth"), {
    timeout: MAGIC_LINK_TIMEOUT_MS,
  });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForFunction(async () => {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    const session = await response.json();
    return Boolean(session?.user?.email);
  });
  await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();

  return { email };
}

export async function dismissProfilePromptIfPresent(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Complete your profile" });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (await dialog.isVisible().catch(() => false)) {
      await dialog.getByRole("button", { name: "Later" }).click();
      await expect(dialog).toBeHidden();
      return;
    }

    await page.waitForTimeout(200);
  }
}
