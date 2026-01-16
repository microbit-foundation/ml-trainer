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
    // Wait for navigation to testing model page - more reliable than waiting
    // for the "Training model…" dialog which may complete too fast to observe
    await this.page.waitForURL(/testing-model/);
  }
}
