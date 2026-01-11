import { expect, Locator, type Page } from "@playwright/test";
import { Navbar } from "./shared";
import path from "path";
import { fileURLToPath } from "url";

const getAbsoluteFilePath = (filePathFromProjectRoot: string) => {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  return path.join(dir.replace("e2e/app", ""), filePathFromProjectRoot);
};

export class NewPage {
  public navbar: Navbar;
  private url: string;
  private resumeSessionBtn: Locator;
  private newSessionBtn: Locator;
  private openSavedSessionBtn: Locator;

  constructor(public readonly page: Page) {
    this.url = `http://localhost:5173${
      process.env.CI ? process.env.BASE_URL : "/"
    }new`;
    this.navbar = new Navbar(page);
    this.newSessionBtn = page.getByRole("button", {
      name: "New session",
    });
    this.resumeSessionBtn = page.getByRole("button", {
      name: "Open last session",
    });
    this.openSavedSessionBtn = page.getByRole("button", {
      name: "Continue a saved session",
    });
  }

  async goto(flags: string[] = []) {
    const response = await this.page.goto(this.url);
    await this.page.evaluate(
      (flags) => localStorage.setItem("flags", flags.join(",")),
      flags
    );
    return response;
  }

  async expectCorrectInitialstate() {
    await expect(this.openSavedSessionBtn).toBeVisible();
    await expect(this.openSavedSessionBtn).toBeEnabled();
    await expect(this.newSessionBtn).toBeVisible();
    await expect(this.newSessionBtn).toBeEnabled();
    await expect(this.resumeSessionBtn).toBeVisible();
    await expect(this.resumeSessionBtn).toBeDisabled();
    await expect(this.page.getByText("No session found")).toBeVisible();
  }

  async startNewSession() {
    await this.newSessionBtn.click();
  }

  async continueSavedSession(filePathFromProjectRoot: string) {
    const filePath = getAbsoluteFilePath(filePathFromProjectRoot);
    const fileChooserPromise = this.page.waitForEvent("filechooser");
    await this.openSavedSessionBtn.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
  }

  async expectResumeButtonToShowProjectName(projectName: string) {
    await expect(this.page.getByText(projectName)).toBeVisible();
  }

  async resumeSession() {
    await this.resumeSessionBtn.click();
  }
}
