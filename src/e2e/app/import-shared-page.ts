import { Locator, type Page, expect } from "@playwright/test";

export class ImportSharedPage {
  private readonly url: string;
  private nameInputField: Locator;
  private openProjectBtn: Locator;

  constructor(public readonly page: Page) {
    this.url = `http://localhost:5173${
      process.env.CI ? process.env.BASE_URL : "/"
    }`;

    this.openProjectBtn = page.getByText("Open project").first();
    this.nameInputField = page.getByTestId("name-text");
  }

  async goto(shortId: string, flags: string[] = ["open"]) {
    const response = await this.page.goto(`${this.url}${shortId}`);
    await this.page.evaluate(
      (flags) => localStorage.setItem("flags", flags.join(",")),
      flags
    );
    return response;
  }

  expectName() {
    return expect(this.nameInputField);
  }

  expectAction(actionName: string) {
    return expect(this.page.getByLabel(`Action "${actionName}"`));
  }
  expectAnyAction() {
    return expect(this.page.getByLabel(`Action `));
  }

  expectMakecodePreview() {
    return expect(this.page.getByAltText("ml.onStart"));
  }

  expectMain() {
    return expect(this.page.locator("main"));
  }

  expectOpenProjectBtn() {
    return expect(this.openProjectBtn);
  }

  clickOpenProjectBtn() {
    return this.openProjectBtn.click();
  }
}
