import { expect, type Page } from "@playwright/test";
import { Navbar } from "./shared";

export class HomePage {
  public navbar: Navbar;
  private url: string;

  constructor(public readonly page: Page) {
    this.url = `http://localhost:5173${
      process.env.CI ? process.env.BASE_URL : "/"
    }`;
    this.navbar = new Navbar(page);
  }

  async goto(flags: string[] = ["open"]) {
    const response = await this.page.goto(this.url);
    await this.page.evaluate(
      (flags) => localStorage.setItem("flags", flags.join(",")),
      flags
    );
    return response;
  }

  async getStarted() {
    await this.page.getByText("Get started").first().click();
  }

  expectOnHomePage() {
    expect(this.page.url()).toEqual(this.url);
  }
}
