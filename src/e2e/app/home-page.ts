/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
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

  expectOnHomePage() {
    expect(this.page.url()).toEqual(this.url);
  }
}
