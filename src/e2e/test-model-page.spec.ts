import { test } from "./fixtures";

test.describe("test model page", () => {
  test.beforeEach(async ({ homePage, dataSamplesPage }) => {
    await homePage.goto();
    await homePage.importProject("test-data/dataset.json");
    await dataSamplesPage.welcomeDialog.close();
  });

  test("initial state", async ({ dataSamplesPage, testModelPage }) => {
    const trainModelDialog = await dataSamplesPage.trainModel();
    await trainModelDialog.train();
    await testModelPage.expectOnPage();
    await testModelPage.expectDefaultCodeView();
  });

  test("model restored when reopening project from home page", async ({
    homePage,
    dataSamplesPage,
    testModelPage,
  }) => {
    const trainModelDialog = await dataSamplesPage.trainModel();
    await trainModelDialog.train();
    await testModelPage.expectOnPage();

    await testModelPage.navbar.home();
    await homePage.expectOnHomePage();
    await homePage.clickProject("Untitled");
    await dataSamplesPage.welcomeDialog.close();

    // The "Testing model" button only shows when the stored model has been
    // restored, which includes loading it into the ML worker.
    await dataSamplesPage.navigateToTestingModel();
    await testModelPage.expectOnPage();
    await testModelPage.expectDefaultCodeView();
  });

  test("model restored when reloading the page", async ({
    dataSamplesPage,
    testModelPage,
  }) => {
    const trainModelDialog = await dataSamplesPage.trainModel();
    await trainModelDialog.train();
    await testModelPage.expectOnPage();

    // Restart the app so the model is restored into a fresh ML worker.
    await testModelPage.page.reload();
    await testModelPage.expectOnPage();
    await testModelPage.expectDefaultCodeView();
  });

  test("edit in makecode", async ({ dataSamplesPage, testModelPage }) => {
    const trainModelDialog = await dataSamplesPage.trainModel();
    await trainModelDialog.train();
    const makecodeEditor = await testModelPage.editInMakeCode();
    await makecodeEditor.closeTourDialog();
    await makecodeEditor.switchToJavaScript();
    await makecodeEditor.editJavaScript(
      "ml.onStart(ml.event.Active, function() { basic.showIcon(IconNames.House) })"
    );
    await makecodeEditor.back();
    await testModelPage.expectMLBlockVisible(["active"]);
  });
});
