import { test } from "./fixtures";

test.describe("home page", () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test("stub", ({ homePage }) => {
    homePage.expectOnHomePage();
  });
});
