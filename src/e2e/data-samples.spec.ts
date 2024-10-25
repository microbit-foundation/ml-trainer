import { test } from "./fixtures";

test.describe("data samples page", () => {
  test.beforeEach(async ({ dataSamplesPage }) => {
    await dataSamplesPage.goto();
  });

  test("starting state", async ({ dataSamplesPage }) => {
    await dataSamplesPage.expectCorrectInitialState();
  });
});
