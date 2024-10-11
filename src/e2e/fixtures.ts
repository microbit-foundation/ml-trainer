import { test as base } from "@playwright/test";
import { HomePage } from "./app/home-page";
import { DataSamplesPage } from "./app/data-samples";
import { TestModelPage } from "./app/test-model";
import { NewPage } from "./app/new-page";

type MyFixtures = {
  homePage: HomePage;
  newPage: NewPage;
  dataSamplesPage: DataSamplesPage;
  testModelPage: TestModelPage;
};

export const test = base.extend<MyFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  newPage: async ({ page }, use) => {
    await use(new NewPage(page));
  },
  dataSamplesPage: async ({ page }, use) => {
    await use(new DataSamplesPage(page));
  },
  testModelPage: async ({ page }, use) => {
    await use(new TestModelPage(page));
  },
});
