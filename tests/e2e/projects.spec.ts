import { expect, test } from "@playwright/test";

import {
  createTestEmail,
  dismissProfilePromptIfPresent,
  loginWithMagicLink,
} from "./utils/auth";

async function getProjectNames(page: import("@playwright/test").Page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/projects", { cache: "no-store" });
    const payload = await response.json();
    return (payload.projects ?? []).map((project: { name: string }) => project.name);
  });
}

async function createProject(
  page: import("@playwright/test").Page,
  projectName: string
) {
  await page.getByRole("button", { name: "Add project" }).click();

  const dialog = page.getByRole("dialog", { name: "Add project" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox", { name: "Name" }).fill(projectName);
  await dialog
    .getByRole("textbox", { name: "Description" })
    .fill("Created by Playwright.");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();
}

test("project create, edit and delete flow works", async ({
  page,
  request,
}, testInfo) => {
  await loginWithMagicLink(page, request, createTestEmail(testInfo.title));

  const projectName = `Project ${Date.now()}`;
  const updatedProjectName = `${projectName} Updated`;

  await page.goto("/dashboard/projects", { waitUntil: "domcontentloaded" });
  await dismissProfilePromptIfPresent(page);
  await expect(
    page.getByRole("heading", { name: "Projects", level: 1 })
  ).toBeVisible();

  await createProject(page, projectName);
  await expect
    .poll(async () => {
      const names = await getProjectNames(page);
      return names.includes(projectName);
    })
    .toBe(true);

  await page.getByText(projectName).hover();
  await page.getByRole("button", { name: "Edit project" }).first().click();

  const editDialog = page.getByRole("dialog", { name: "Edit project" });
  await expect(editDialog).toBeVisible();
  await editDialog.getByRole("textbox", { name: "Name" }).fill(updatedProjectName);
  await editDialog.getByRole("button", { name: "Save" }).click();
  await expect(editDialog).toBeHidden();

  await expect
    .poll(async () => {
      const names = await getProjectNames(page);
      return names.includes(updatedProjectName);
    })
    .toBe(true);

  await page.getByText(updatedProjectName).hover();
  await page.getByRole("button", { name: "Delete project" }).first().click();

  const confirmDialog = page.getByRole("dialog", { name: "Delete project" });
  await expect(confirmDialog).toBeVisible();
  await confirmDialog.getByRole("button", { name: "Delete" }).click();
  await expect(confirmDialog).toBeHidden();

  await expect
    .poll(async () => {
      const names = await getProjectNames(page);
      return names.includes(updatedProjectName);
    })
    .toBe(false);
});
