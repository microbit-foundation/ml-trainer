/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { expect, type Page, type BrowserContext } from "@playwright/test";
import { getAbsoluteFilePath, Navbar } from "./shared";

/**
 * Browser-context script: poll the app's IndexedDB until the default
 * settings row exists (the app writes it asynchronously on first load),
 * then patch `analyticsConsent` to "denied". Polling avoids racing the
 * app's `db.add`, which throws on key collision and would otherwise
 * break startup if our `put` landed first.
 */
const seedAnalyticsConsentDenied = async () => {
  const openDb = () =>
    new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("ml", 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  for (let i = 0; i < 50; i++) {
    const db = await openDb();
    const existing = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction("settings", "readonly");
      const get = tx.objectStore("settings").get("settings");
      get.onsuccess = () => resolve(get.result);
      get.onerror = () => reject(get.error);
    });
    if (existing && typeof existing === "object") {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("settings", "readwrite");
        tx.objectStore("settings").put(
          { ...existing, analyticsConsent: "denied" },
          "settings"
        );
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
      return;
    }
    db.close();
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for IDB settings row to appear");
};

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
    // Pre-seed analyticsConsent so the native consent dialog doesn't
    // auto-open and block UI under flags.ios / flags.android. Web
    // compliance is suppressed separately via the MBCC cookie.
    await this.page.evaluate(seedAnalyticsConsentDenied);
    // Reload so the app reads the flags on startup
    const response = await this.page.reload();
    return response;
  }

  async newProject() {
    await this.page.getByRole("button", { name: "New project" }).click();
    await this.page.getByRole("button", { name: "Create project" }).click();
  }

  async importProject(filePathFromProjectRoot: string) {
    const filePath = getAbsoluteFilePath(filePathFromProjectRoot);
    const fileChooserPromise = this.page.waitForEvent("filechooser");
    await this.page.getByRole("button", { name: "Import" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
  }

  async expectOnHomePage() {
    await this.page.waitForURL(this.url);
  }

  // Card actions (carousel project cards)

  async clickProject(projectName: string) {
    await this.page
      .getByRole("button", { name: projectName, exact: true })
      .click();
  }

  async openCardMenu(projectName: string) {
    await this.page
      .getByRole("button", { name: `${projectName} actions menu` })
      .first()
      .click();
  }

  async menuOpen(projectName: string) {
    await this.openCardMenu(projectName);
    await this.page.getByRole("menuitem", { name: "Open" }).click();
  }

  async menuRename(projectName: string, newName: string) {
    await this.openCardMenu(projectName);
    await this.page.getByRole("menuitem", { name: "Rename" }).click();
    await this.fillNameDialogAndConfirm(newName, "Rename");
  }

  async menuDuplicate(projectName: string, newName: string) {
    await this.openCardMenu(projectName);
    await this.page.getByRole("menuitem", { name: "Duplicate" }).click();
    await this.fillNameDialogAndConfirm(newName, "Duplicate");
  }

  async menuDelete(projectName: string) {
    await this.openCardMenu(projectName);
    await this.page.getByRole("menuitem", { name: "Delete" }).click();
    await this.confirmDelete();
  }

  async expectProjectVisible(projectName: string) {
    await expect(
      this.page.getByRole("button", { name: projectName, exact: true })
    ).toBeVisible();
  }

  async expectProjectNotVisible(projectName: string) {
    await expect(
      this.page.getByRole("button", { name: projectName, exact: true })
    ).toBeHidden();
  }

  async viewAllProjects() {
    await this.page.getByRole("link", { name: "View all" }).click();
  }

  // Dialog helpers

  private async fillNameDialogAndConfirm(
    newName: string,
    confirmLabel: string
  ) {
    const dialog = this.page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const nameInput = dialog.getByRole("textbox");
    await nameInput.clear();
    await nameInput.fill(newName);
    await dialog.getByRole("button", { name: confirmLabel }).click();
    await expect(dialog).toBeHidden();
  }

  private async confirmDelete() {
    const dialog = this.page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Confirm" }).click();
    await expect(dialog).toBeHidden();
  }
}
