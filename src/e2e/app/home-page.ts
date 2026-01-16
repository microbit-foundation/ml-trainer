/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { expect, type Page, type BrowserContext } from "@playwright/test";
import { Navbar } from "./shared";

export class HomePage {
  public navbar: Navbar;
  private url: string;

  constructor(public readonly page: Page, private context: BrowserContext) {
    this.url = `http://localhost:5173${
      process.env.CI ? process.env.BASE_URL : "/"
    }`;
    this.navbar = new Navbar(page);
  }

  async setupContext() {
    await this.context.addCookies([
      {
        // See corresponding code in App.tsx.
        name: "mockDevice",
        value: "1",
        url: this.url,
      },
      // Don't show compliance notice for Foundation builds
      {
        name: "MBCC",
        value: encodeURIComponent(
          JSON.stringify({
            version: 1,
            analytics: false,
            functional: true,
          })
        ),
        url: this.url,
      },
    ]);
  }

  async goto(flags: string[] = []) {
    // Navigate first to establish the origin for localStorage
    await this.page.goto(this.url);
    // Set flags in localStorage
    await this.page.evaluate(
      (flags) => localStorage.setItem("flags", flags.join(",")),
      flags
    );
    // Reload so the app reads the flags on startup
    const response = await this.page.reload();
    return response;
  }

  async getStarted() {
    await this.page.getByText("Get started").first().click();
  }

  expectOnHomePage() {
    expect(this.page.url()).toEqual(this.url);
  }
}
