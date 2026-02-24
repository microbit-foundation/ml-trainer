/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { test } from "./fixtures";

test.describe("home page", () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test("start new project", async ({ homePage, dataSamplesPage }) => {
    await homePage.newProject();
    await dataSamplesPage.expectOnPage();
  });

  test("import a saved project (.json file)", async ({
    homePage,
    dataSamplesPage,
  }) => {
    await homePage.importProject("test-data/dataset.json");
    await dataSamplesPage.expectOnPage();
  });
});

test.describe("home page project card actions", () => {
  test.beforeEach(async ({ homePage, dataSamplesPage }) => {
    await homePage.goto();
    await homePage.importProject("test-data/dataset.json");
    await dataSamplesPage.welcomeDialog.close();
    await dataSamplesPage.navbar.home();
    await homePage.expectOnHomePage();
  });

  test("open project by clicking card and from card menu", async ({
    homePage,
    dataSamplesPage,
  }) => {
    // Click card to open
    await homePage.clickProject("Untitled");
    await dataSamplesPage.expectUrl();

    // Navigate back and open via menu
    await dataSamplesPage.welcomeDialog.close();
    await dataSamplesPage.navbar.home();
    await homePage.expectOnHomePage();
    await homePage.menuOpen("Untitled");
    await dataSamplesPage.expectUrl();
  });

  test("rename, duplicate, and delete project from card menu", async ({
    homePage,
  }) => {
    // Rename
    await homePage.menuRename("Untitled", "Renamed project");
    await homePage.expectProjectVisible("Renamed project");

    // Duplicate the renamed project
    await homePage.menuDuplicate("Renamed project", "Copy of project");
    await homePage.expectProjectVisible("Renamed project");
    await homePage.expectProjectVisible("Copy of project");

    // Delete one
    await homePage.menuDelete("Copy of project");
    await homePage.expectProjectNotVisible("Copy of project");
    await homePage.expectProjectVisible("Renamed project");
  });

  test("view all projects link navigates to projects page", async ({
    homePage,
    projectsPage,
  }) => {
    await homePage.viewAllProjects();
    await projectsPage.expectOnPage();
  });
});
