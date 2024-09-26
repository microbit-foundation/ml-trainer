import type { Locator, Page } from "@playwright/test";

export class Navbar {
  private saveButton: Locator;

  constructor(public readonly page: Page) {
    this.saveButton = page.getByRole("button", { name: "Save" }).first();
  }

  async save() {
    await this.saveButton.click();
  }
}
