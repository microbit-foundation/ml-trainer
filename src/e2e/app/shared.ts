/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import type { Locator, Page } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

export const getAbsoluteFilePath = (filePathFromProjectRoot: string) => {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  return path.join(dir.replace("e2e/app", ""), filePathFromProjectRoot);
};

/**
 * The modal dialog, excluding menu popovers. react-aria-components popovers
 * (menus etc.) also have role="dialog" (briefly still present while animating
 * out), so a bare getByRole("dialog") can be ambiguous. Both Chakra and
 * shared-ui modals render the dialog on a <section>; popovers are <div>s.
 */
export const modalDialog = (page: Page): Locator =>
  page.getByRole("dialog").and(page.locator("section"));

export class Navbar {
  private saveButton: Locator;
  private homeButton: Locator;

  constructor(public readonly page: Page) {
    this.saveButton = page.getByRole("button", { name: "Save" }).first();
    this.homeButton = page.getByRole("button", { name: "Home" }).first();
  }

  async save() {
    await this.saveButton.click();
  }
  async home() {
    await this.homeButton.click();
  }
}
