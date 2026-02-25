/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { expect, Locator, type Page } from "@playwright/test";

export class ProjectsPage {
  private url: string;
  private heading: Locator;
  private searchInput: Locator;
  private homeButton: Locator;
  private selectionToolbar: Locator;

  constructor(public readonly page: Page) {
    this.url = `http://localhost:5173${
      process.env.CI ? process.env.BASE_URL : "/"
    }projects`;
    this.heading = this.page.getByRole("heading", { name: "Projects" });
    this.searchInput = this.page.getByRole("textbox", { name: "Search" });
    this.homeButton = this.page.getByRole("button", { name: "Home page" });
    this.selectionToolbar = this.page.getByRole("group", {
      name: "Selection actions",
    });
  }

  async goto(flags: string[] = ["open"]) {
    const response = await this.page.goto(this.url);
    await this.page.evaluate(
      (flags) => localStorage.setItem("flags", flags.join(",")),
      flags
    );
    return response;
  }

  async expectOnPage() {
    await expect(this.heading).toBeVisible();
  }

  async expectProjectCount(count: number) {
    const cards = this.page.getByRole("checkbox");
    await expect(cards).toHaveCount(count, { timeout: 5_000 });
  }

  async expectNoProjects() {
    await expect(this.page.getByText("No projects to display")).toBeVisible();
  }

  async expectProjectVisible(name: string) {
    await expect(
      this.page.getByRole("button", { name, exact: true })
    ).toBeVisible();
  }

  async expectProjectNotVisible(name: string) {
    await expect(
      this.page.getByRole("button", { name, exact: true })
    ).toBeHidden();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async clearSearch() {
    await this.page.getByRole("button", { name: "Clear" }).click();
  }

  async goHome() {
    await this.homeButton.first().click();
  }

  // Card menu actions (three-dot menu on each card)

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

  // Checkbox selection

  async selectProject(projectName: string) {
    const checkbox = this.page.getByRole("checkbox", {
      name: `Select ${projectName}`,
    });
    await checkbox.check({ force: true });
    await expect(checkbox).toBeChecked();
  }

  // Toolbar actions (appear after selecting via checkbox)

  async expectToolbarVisible() {
    await expect(this.selectionToolbar.first()).toBeVisible();
  }

  async expectToolbarHidden() {
    await expect(this.selectionToolbar.first()).toBeHidden();
  }

  async expectToolbarButtons(expected: string[]) {
    const buttons = this.selectionToolbar.first().getByRole("button");
    await expect(buttons).toHaveCount(expected.length);
    for (const name of expected) {
      await expect(
        this.selectionToolbar.first().getByRole("button", { name })
      ).toBeVisible();
    }
  }

  async toolbarRename(newName: string) {
    await this.selectionToolbar
      .first()
      .getByRole("button", { name: "Rename" })
      .click();
    await this.fillNameDialogAndConfirm(newName, "Rename");
  }

  async toolbarDuplicate(newName: string) {
    await this.selectionToolbar
      .first()
      .getByRole("button", { name: "Duplicate" })
      .click();
    await this.fillNameDialogAndConfirm(newName, "Duplicate");
  }

  async toolbarDelete() {
    await this.selectionToolbar
      .first()
      .getByRole("button", { name: /Delete/ })
      .click();
    await this.confirmDelete();
  }

  async toolbarClick(name: string) {
    await this.selectionToolbar.first().getByRole("button", { name }).click();
  }

  async toolbarClear() {
    await this.selectionToolbar
      .first()
      .getByRole("button", { name: "Clear" })
      .click();
  }

  // Sort controls

  async sortBy(field: "Name" | "Last modified") {
    await this.page
      .getByRole("combobox", { name: "Sort projects" })
      .selectOption({ label: field });
  }

  async toggleSortDirection() {
    await this.page.getByRole("button", { name: /order$/ }).click();
  }

  async expectProjectOrder(expectedNames: string[]) {
    const checkboxes = this.page.getByRole("checkbox");
    await expect(checkboxes).toHaveCount(expectedNames.length);
    for (let i = 0; i < expectedNames.length; i++) {
      await expect(checkboxes.nth(i)).toHaveAccessibleName(
        `Select ${expectedNames[i]}`
      );
    }
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

  async expectDeleteDialogText(expected: string | RegExp) {
    const dialog = this.page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(expected);
  }
}
