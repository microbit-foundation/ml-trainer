import { type Page } from "@playwright/test";
import {
  Navbar,
} from "./shared";

export class DataSamplesPage {
  public readonly navbar: Navbar;

  constructor(public readonly page: Page) {
    this.navbar = new Navbar(page);
  }

}
