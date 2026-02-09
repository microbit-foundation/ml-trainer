/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { test as base } from "@playwright/test";
import { HomePage } from "./app/home-page";
import { DataSamplesPage } from "./app/data-samples";
import { TestModelPage } from "./app/test-model-page";
import { OpenSharedProjectPage } from "./app/open-shared-project-page";
import { ImportPage } from "./app/import-page";
import { ProjectsPage } from "./app/projects-page";

type MyFixtures = {
  homePage: HomePage;
  dataSamplesPage: DataSamplesPage;
  testModelPage: TestModelPage;
  openSharedProjectPage: OpenSharedProjectPage;
  importPage: ImportPage;
  projectsPage: ProjectsPage;
};

export const test = base.extend<MyFixtures>({
  homePage: async ({ page, context }, use) => {
    const homePage = new HomePage(page, context);
    await homePage.setupContext();
    await use(homePage);
  },
  dataSamplesPage: async ({ page }, use) => {
    await use(new DataSamplesPage(page));
  },
  testModelPage: async ({ page }, use) => {
    await use(new TestModelPage(page));
  },
  openSharedProjectPage: async ({ page }, use) => {
    await use(new OpenSharedProjectPage(page));
  },
  importPage: async ({ page }, use) => {
    await use(new ImportPage(page));
  },
  projectsPage: async ({ page }, use) => {
    await use(new ProjectsPage(page));
  },
});
