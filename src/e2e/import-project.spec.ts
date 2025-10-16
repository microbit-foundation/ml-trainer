/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Page } from "playwright/test";
import { DataSamplesPage } from "./app/data-samples";
import { ImportPage } from "./app/import-page";
import { test } from "./fixtures";

test.describe("import project (microbit.org case)", () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.setupContext();
  });

  test("confirm and import", async ({ importPage, dataSamplesPage }) => {
    await importPage.gotoSimpleAIExerciseTimer();
    await importPage.expectOnPage();
    await importPage.expectName("Simple AI exercise timer");
    await importPage.startSession();

    await dataSamplesPage.expectOnPage();
    await dataSamplesPage.expectActions(["exercising", "not exercising"]);
  });

  test("cross-tab behavior regression", async ({
    newPage: newPage1,
    dataSamplesPage: dataSamplesPage1,
    context,
  }) => {
    // https://github.com/microbit-foundation/ml-trainer/issues/618
    await newPage1.goto();
    await newPage1.startNewSession();
    await dataSamplesPage1.expectOnPage();

    const page2 = await context.newPage();
    const importPage2 = new ImportPage(page2);
    await importPage2.gotoSimpleAIExerciseTimer();
    await importPage2.startSession();
    const dataSamplesPage2 = new DataSamplesPage(page2);
    await dataSamplesPage2.expectOnPage();
    await dataSamplesPage2.expectActions(["exercising", "not exercising"]);

    await triggerVisibilityChanged(page2, true);
    await triggerVisibilityChanged(page2, false);

    await dataSamplesPage2.expectActions([]);
  });
});

const triggerVisibilityChanged = async (page: Page, hidden: boolean) => {
  const frames = page.frames();
  if (frames.length > 0) {
    await Promise.allSettled(
      page.frames().map((frame) => frame.waitForLoadState("networkidle"))
    );
  }

  const makecode = frames.find((f) => {
    return (
      // Allow for fragments, extra params.
      f.url().startsWith("https://makecode.microbit.org/?lang=en&controller=2")
    );
  });

  const setHidden = (value: boolean) => {
    Object.defineProperty(document, "visibilityState", {
      value: value ? "hidden" : "visible",
      writable: true,
    });
    Object.defineProperty(document, "hidden", { value, writable: true });
    document.dispatchEvent(new Event("visibilitychange", { bubbles: true }));
  };
  await makecode!.evaluate(setHidden, hidden);
  await new Promise((resolve) => setTimeout(resolve, 3000));
};
