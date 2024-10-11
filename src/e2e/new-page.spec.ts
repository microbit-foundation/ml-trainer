import { test } from "./fixtures";

test.describe("new page", () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
    await homePage.getStarted();
  });

  test("starting state", async ({ newPage }) => {
    await newPage.expectCorrectStartingButtonStates();
  });

  test("start new session", async ({ newPage, dataSamplesPage }) => {
    await newPage.startNewSession();
    await dataSamplesPage.expectOnPageWithConnectDialog();
  });

  test("continue a saved session (.json file)", async ({
    newPage,
    dataSamplesPage,
  }) => {
    await newPage.continueSavedSession("test-data/dataset.json");
    await dataSamplesPage.expectOnPage();
  });

  test("resume session", async ({ newPage, homePage, dataSamplesPage }) => {
    await newPage.startNewSession();
    await dataSamplesPage.closeConnectDialog();
    await dataSamplesPage.navbar.home();
    await homePage.getStarted();
    await newPage.expectResumeButtonToShowProjectName("Untitled");
    await newPage.resumeSession();
    await dataSamplesPage.expectOnPage();
  });
});