import { Locator, type Page, expect } from "@playwright/test";
import { appUrl } from "./shared";

export class OpenSharedProjectPage {
  private readonly url: string;
  private nameInputField: Locator;
  private openProjectBtn: Locator;

  constructor(public readonly page: Page) {
    this.url = appUrl();

    this.openProjectBtn = page.getByText("Open project").first();
    this.nameInputField = page.getByTestId("name-text");
  }

  /**
   * Unlike other page fixtures, you must specify a shareId in the goto
   */
  async goto(shareId: string, flags: string[] = []) {
    const response = await this.page.goto(`${this.url}${shareId}`);
    await this.page.evaluate(
      (flags) => localStorage.setItem("flags", flags.join(",")),
      flags
    );
    return response;
  }

  /**
   * Holds the request for the shared project's header until the returned
   * function is called, so the loading state it ends can be observed. Call
   * before goto.
   */
  async holdProjectLoad(): Promise<() => void> {
    let release = () => {};
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    await this.page.route(/makecode\.com\/api\/[^/]+$/, async (route) => {
      await released;
      await route.continue();
    });
    return release;
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
    // MakeCode renders the preview in an iframe, which can take longer than
    // the default timeout when CI runs tests in parallel.
    return expect.configure({ timeout: 15_000 })(
      this.page.getByAltText("ml.onStart")
    );
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

  expectTitle() {
    return expect(this.page.getByText("Open shared CreateAI project"));
  }

  expectErrorMessage() {
    return expect(this.page.getByText("Error downloading the project code"));
  }
}
