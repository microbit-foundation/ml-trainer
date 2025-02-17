import { test } from "./fixtures";

test.describe("test model page", () => {
  test.beforeEach(async ({ homePage, newPage }) => {
    await homePage.setupContext();
    await homePage.goto();
    await homePage.getStarted();
    await newPage.continueSavedSession("test-data/dataset.json");
  });

  test("initial state", async ({ dataSamplesPage, testModelPage }) => {
    const trainModelDialog = await dataSamplesPage.trainModel();
    await trainModelDialog.train();
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
