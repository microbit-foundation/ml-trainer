import { expect, Locator, type Page } from "@playwright/test";
import { Navbar } from "./shared";

export class DataSamplesPage {
  public readonly navbar: Navbar;
  private url: string;
  private heading: Locator;

  constructor(public readonly page: Page) {
    this.url = `http://localhost:5173${
      process.env.CI ? process.env.BASE_URL : "/"
    }data-samples`;
    this.navbar = new Navbar(page);
    this.heading = this.page.getByRole("heading", { name: "Data samples" });
  }

  expectUrl() {
    expect(this.page.url()).toEqual(this.url);
  }

  async closeConnectDialog() {
    await this.page.getByLabel("Close").click();
  }

  async expectOnPage() {
    await expect(this.heading).toBeVisible();
    this.expectUrl();
  }

  async expectOnPageWithConnectDialog() {
    await expect(
      this.page.getByRole("heading", { name: "What you need to connect" })
    ).toBeVisible();
    this.expectUrl();
  }
}
