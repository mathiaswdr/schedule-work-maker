import { expect, test } from "@playwright/test";

import {
  createTestEmail,
  dismissProfilePromptIfPresent,
  loginWithMagicLink,
} from "./utils/auth";

async function createClient(page: import("@playwright/test").Page, clientName: string) {
  await page.getByRole("button", { name: "Add client" }).click();

  const dialog = page.getByRole("dialog", { name: "Add client" });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("textbox", { name: "Name" }).fill(clientName);
  await dialog
    .getByRole("textbox", { name: "Email" })
    .fill("billing@acme.test");
  await dialog
    .getByRole("textbox", { name: "Address" })
    .fill("123 Market Street");
  await dialog
    .getByRole("textbox", { name: "Postal code" })
    .fill("8001");
  await dialog.getByRole("textbox", { name: "City" }).fill("Zurich");
  await dialog.getByRole("textbox", { name: "Country" }).fill("Switzerland");
  await dialog
    .getByRole("textbox", { name: "Notes" })
    .fill("Created by Playwright.");

  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();
}

async function getClientNames(page: import("@playwright/test").Page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/clients", { cache: "no-store" });
    const payload = await response.json();
    return (payload.clients ?? []).map((client: { name: string }) => client.name);
  });
}

test("important form submission works by creating a client", async ({
  page,
  request,
}, testInfo) => {
  await loginWithMagicLink(page, request, createTestEmail(testInfo.title));

  const clientName = `Acme ${Date.now()}`;

  await page.goto("/dashboard/clients");
  await dismissProfilePromptIfPresent(page);
  await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();

  await createClient(page, clientName);
  await expect(page.getByText(clientName)).toBeVisible();
});

test("client edit flow works", async ({ page, request }, testInfo) => {
  await loginWithMagicLink(page, request, createTestEmail(testInfo.title));

  const originalName = `Client ${Date.now()}`;
  const updatedName = `${originalName} Updated`;

  await page.goto("/dashboard/clients");
  await dismissProfilePromptIfPresent(page);
  await createClient(page, originalName);

  await page.getByText(originalName).click();
  await expect(page.getByRole("heading", { name: originalName })).toBeVisible();

  await page.getByRole("button", { name: "Edit client" }).click();

  const dialog = page.getByRole("dialog", { name: "Edit client" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox", { name: "Name" }).fill(updatedName);
  await dialog.getByRole("button", { name: "Save" }).click();

  await expect(dialog).toBeHidden();
  await expect
    .poll(async () => {
      const names = await getClientNames(page);
      return names.includes(updatedName);
    })
    .toBe(true);
});

test("client delete flow works", async ({ page, request }, testInfo) => {
  await loginWithMagicLink(page, request, createTestEmail(testInfo.title));

  const clientName = `Delete Me ${Date.now()}`;

  await page.goto("/dashboard/clients");
  await dismissProfilePromptIfPresent(page);
  await createClient(page, clientName);

  await page.getByText(clientName).click();
  await expect(page.getByRole("heading", { name: clientName })).toBeVisible();

  await page.getByRole("button", { name: "Delete client" }).click();

  const confirmDialog = page.getByRole("dialog", { name: "Delete client" });
  await expect(confirmDialog).toBeVisible();

  const deleteResponsePromise = page.waitForResponse((response) => {
    return (
      response.request().method() === "DELETE" &&
      response.url().includes("/api/clients/")
    );
  });

  await confirmDialog.getByRole("button", { name: "Delete" }).click();

  const deleteResponse = await deleteResponsePromise;
  expect(deleteResponse.ok()).toBeTruthy();

  await expect
    .poll(async () => {
      const names = await getClientNames(page);
      return names.includes(clientName);
    })
    .toBe(false);
});

test("client delete can be canceled", async ({ page, request }, testInfo) => {
  await loginWithMagicLink(page, request, createTestEmail(testInfo.title));

  const clientName = `Keep Me ${Date.now()}`;

  await page.goto("/dashboard/clients");
  await dismissProfilePromptIfPresent(page);
  await createClient(page, clientName);

  await page.getByText(clientName).click();
  await expect(page.getByRole("heading", { name: clientName })).toBeVisible();

  await page.getByRole("button", { name: "Delete client" }).click();

  const confirmDialog = page.getByRole("dialog", { name: "Delete client" });
  await expect(confirmDialog).toBeVisible();
  await confirmDialog.getByRole("button", { name: "Cancel" }).click();
  await expect(confirmDialog).toBeHidden();

  await expect
    .poll(async () => {
      const names = await getClientNames(page);
      return names.includes(clientName);
    })
    .toBe(true);
});
