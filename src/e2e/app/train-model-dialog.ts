/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { type Page } from "@playwright/test";

export class TrainModelDialog {
  constructor(public readonly page: Page) {}

  async train() {
    await this.page.getByRole("button", { name: "Start training" }).click();
    await this.page.getByText("Training model…").waitFor({ state: "visible" });
    await this.page.getByText("Training model…").waitFor({ state: "hidden" });
  }
}
