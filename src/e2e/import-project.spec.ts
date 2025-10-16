/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
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
});
