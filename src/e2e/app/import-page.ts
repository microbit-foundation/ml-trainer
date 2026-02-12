import { Locator, type Page, expect } from "@playwright/test";

export class ImportPage {
  private readonly url: string;
  private nameInputField: Locator;
  private openProjectBtn: Locator;

  constructor(public readonly page: Page) {
    this.url = `http://localhost:5173${
      process.env.CI ? process.env.BASE_URL : "/"
    }`;

    this.openProjectBtn = page
      .getByRole("button", { name: "Open project" })
      .first();
    this.nameInputField = page.getByTestId("name-text");
  }

  async gotoSimpleAIExerciseTimer() {
    // The import process relies on the e2e flag in this query string
    // for the proxy to be used.
    const query =
      "flag=e2e&id=simple-ai-exercise-timer&project=Project%3A%20Simple%20AI%20exercise%20timer&name=Simple%20AI%20exercise%20timer&editors=makecode";
    return this.page.goto(`${this.url}import?${query}`);
  }

  expectName(expected: string) {
    return expect(this.nameInputField).toHaveValue(expected);
  }

  async openProject() {
    // Might still be loading.
    await expect(this.openProjectBtn).toBeEnabled({
      timeout: 5_000,
    });
    await this.openProjectBtn.click();
  }

  async expectOnPage() {
    await expect(this.page.getByText("New project setup")).toBeVisible();
    await expect(this.nameInputField).toBeVisible();
    await expect(this.openProjectBtn).toBeVisible();
  }
}
