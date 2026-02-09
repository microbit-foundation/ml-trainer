/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { test } from "./fixtures";

test.describe("projects page", () => {
  test("shows no projects message when empty", async ({
    homePage,
    projectsPage,
  }) => {
    await homePage.goto();
    await projectsPage.goto();
    await projectsPage.expectOnPage();
    await projectsPage.expectNoProjects();
  });

  test("shows project after creating one", async ({
    homePage,
    dataSamplesPage,
    projectsPage,
  }) => {
    await homePage.goto();
    await homePage.importProject("test-data/dataset.json");
    await dataSamplesPage.welcomeDialog.close();
    await dataSamplesPage.navbar.home();
    await projectsPage.goto();
    await projectsPage.expectOnPage();
    await projectsPage.expectProjectCount(1);
  });

  test("navigate home from projects page", async ({
    homePage,
    projectsPage,
  }) => {
    await homePage.goto();
    await projectsPage.goto();
    await projectsPage.expectOnPage();
    await projectsPage.goHome();
    homePage.expectOnHomePage();
  });

  test("search filters projects", async ({
    homePage,
    dataSamplesPage,
    projectsPage,
  }) => {
    await homePage.goto();
    await homePage.importProject("test-data/dataset.json");
    await dataSamplesPage.welcomeDialog.close();
    await dataSamplesPage.navbar.home();
    await projectsPage.goto();
    await projectsPage.expectOnPage();
    await projectsPage.expectProjectCount(1);

    await projectsPage.search("zzz-nonexistent-zzz");
    await projectsPage.expectNoProjects();

    await projectsPage.clearSearch();
    await projectsPage.expectProjectCount(1);
  });
});

test.describe("projects page card menu actions", () => {
  test.beforeEach(async ({ homePage, dataSamplesPage, projectsPage }) => {
    await homePage.goto();
    await homePage.importProject("test-data/dataset.json");
    await dataSamplesPage.welcomeDialog.close();
    await dataSamplesPage.navbar.home();
    await projectsPage.goto();
    await projectsPage.expectOnPage();
    await projectsPage.expectProjectCount(1);
  });

  test("open project from menu", async ({ projectsPage, dataSamplesPage }) => {
    await projectsPage.menuOpen("Untitled");
    await dataSamplesPage.expectUrl();
  });

  test("rename project from menu", async ({ projectsPage }) => {
    await projectsPage.menuRename("Untitled", "Renamed project");
    await projectsPage.expectProjectVisible("Renamed project");
    await projectsPage.expectProjectCount(1);
  });

  test("duplicate project from menu", async ({ projectsPage }) => {
    await projectsPage.menuDuplicate("Untitled", "Copy of project");
    await projectsPage.expectProjectVisible("Untitled");
    await projectsPage.expectProjectVisible("Copy of project");
    await projectsPage.expectProjectCount(2);
  });

  test("delete project from menu", async ({ projectsPage }) => {
    await projectsPage.menuDelete("Untitled");
    await projectsPage.expectNoProjects();
  });
});

test.describe("projects page toolbar actions", () => {
  test.beforeEach(async ({ homePage, dataSamplesPage, projectsPage }) => {
    await homePage.goto();
    await homePage.importProject("test-data/dataset.json");
    await dataSamplesPage.welcomeDialog.close();
    await dataSamplesPage.navbar.home();
    await projectsPage.goto();
    await projectsPage.expectOnPage();
    await projectsPage.expectProjectCount(1);
  });

  test("toolbar hidden when nothing selected", async ({ projectsPage }) => {
    await projectsPage.expectToolbarHidden();
  });

  test("toolbar visible after selecting a project", async ({
    projectsPage,
  }) => {
    await projectsPage.selectProject("Untitled");
    await projectsPage.expectToolbarVisible();
  });

  test("single select shows rename, duplicate, delete, clear", async ({
    projectsPage,
  }) => {
    await projectsPage.selectProject("Untitled");
    await projectsPage.expectToolbarButtons([
      "Rename",
      "Duplicate",
      "Delete",
      "Clear",
    ]);
  });

  test("clear clears selection and hides toolbar", async ({ projectsPage }) => {
    await projectsPage.selectProject("Untitled");
    await projectsPage.expectToolbarVisible();
    await projectsPage.toolbarClear();
    await projectsPage.expectToolbarHidden();
  });

  test("rename from toolbar", async ({ projectsPage }) => {
    await projectsPage.selectProject("Untitled");
    await projectsPage.toolbarRename("Toolbar renamed");
    await projectsPage.expectProjectVisible("Toolbar renamed");
    await projectsPage.expectProjectCount(1);
  });

  test("duplicate from toolbar", async ({ projectsPage }) => {
    await projectsPage.selectProject("Untitled");
    await projectsPage.toolbarDuplicate("Toolbar copy");
    await projectsPage.expectProjectVisible("Untitled");
    await projectsPage.expectProjectVisible("Toolbar copy");
    await projectsPage.expectProjectCount(2);
  });

  test("single delete from toolbar", async ({ projectsPage }) => {
    await projectsPage.selectProject("Untitled");
    await projectsPage.toolbarDelete();
    await projectsPage.expectNoProjects();
  });
});

test.describe("projects page multi-select", () => {
  test.beforeEach(async ({ homePage, dataSamplesPage, projectsPage }) => {
    // Create first project and rename it
    await homePage.goto();
    await homePage.importProject("test-data/dataset.json");
    await dataSamplesPage.welcomeDialog.close();
    await dataSamplesPage.navbar.home();

    // Create second project
    await homePage.newProject();
    await dataSamplesPage.welcomeDialog.close();
    await dataSamplesPage.navbar.home();

    // Go to projects page and rename them for clarity
    await projectsPage.goto();
    await projectsPage.expectProjectCount(2);
    await projectsPage.menuRename("Untitled", "Project A");
    await projectsPage.menuRename("Untitled", "Project B");
  });

  test("multi-select toolbar only shows delete and clear", async ({
    projectsPage,
  }) => {
    await projectsPage.selectProject("Project A");
    await projectsPage.selectProject("Project B");
    await projectsPage.expectToolbarButtons(["Delete 2 projects", "Clear"]);
  });

  test("multi-select delete removes all selected", async ({ projectsPage }) => {
    await projectsPage.selectProject("Project A");
    await projectsPage.selectProject("Project B");
    await projectsPage.toolbarDelete();
    await projectsPage.expectNoProjects();
  });

  test("multi-select clear clears all selections", async ({ projectsPage }) => {
    await projectsPage.selectProject("Project A");
    await projectsPage.selectProject("Project B");
    await projectsPage.expectToolbarVisible();
    await projectsPage.toolbarClear();
    await projectsPage.expectToolbarHidden();
  });

  test("multi-select delete only removes selected projects", async ({
    projectsPage,
  }) => {
    await projectsPage.selectProject("Project A");
    await projectsPage.toolbarDelete();
    await projectsPage.expectProjectCount(1);
    await projectsPage.expectProjectVisible("Project B");
    await projectsPage.expectProjectNotVisible("Project A");
  });
});
