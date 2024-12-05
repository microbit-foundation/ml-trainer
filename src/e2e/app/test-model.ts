/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { type Page } from "@playwright/test";
import { Navbar } from "./shared";

export class TestModelPage {
  public readonly navbar: Navbar;

  constructor(public readonly page: Page) {
    this.navbar = new Navbar(page);
  }
}
