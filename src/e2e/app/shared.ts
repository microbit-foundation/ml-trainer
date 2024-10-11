import type { Locator, Page } from "@playwright/test";

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
