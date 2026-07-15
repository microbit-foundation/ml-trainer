/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 *
 * Whole-app screenshot catalogue for the visual fidelity harness. Not part
 * of the default e2e project; bin/fidelity.mjs runs it twice — once against
 * a baseline git ref with --update-snapshots, then against the working tree
 * — and the Playwright HTML report shows the diffs. Baselines are per-run
 * artefacts in .fidelity/, never committed. See RAC-MIGRATION.md.
 */
import { expect, type Locator, type Page } from "@playwright/test";
import { dialogTitles } from "./app/connection-dialogs";
import { modalDialog } from "./app/shared";
import { test } from "./fixtures";

const bluetooth = dialogTitles.bluetooth;

/**
 * Soft so one mismatch doesn't hide diffs later in the same flow.
 */
const screenshot = async (page: Page, name: string, mask: Locator[] = []) => {
  await expect.soft(page).toHaveScreenshot(`${name}.png`, { mask });
};

/**
 * The live graph draws from a rolling time window so its pixels are never
 * comparable across runs. Recording graphs/fingerprints are deterministic
 * renders of imported data and stay unmasked.
 */
const liveGraph = (page: Page): Locator[] => [page.locator("#smoothie-chart")];

/**
 * Make all in-page randomness deterministic so the harness's two runs
 * produce identical states: imported actions/recordings get fresh uuids
 * whose IndexedDB key order drives card-subtitle and recording-preview
 * order, and the mock USB device id determines the suggested Bluetooth
 * pattern. The uuid-relevant part must be order-based, not just seeded:
 * async interleaving can shift how many random calls happen between two
 * uuid() calls, so a seeded sequence alone still flips their relative
 * order under load. A monotonic prefix makes later uuids always sort
 * after earlier ones (creation order), which is what the UI shows.
 */
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    // mulberry32
    let s = 42;
    const random = () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    Math.random = random;
    let calls = 0;
    crypto.getRandomValues = <T extends ArrayBufferView | null>(
      array: T
    ): T => {
      if (array) {
        calls++;
        const bytes = new Uint8Array(
          array.buffer,
          array.byteOffset,
          array.byteLength
        );
        for (let i = 0; i < bytes.length; i++) {
          // Leading bytes count up per call; uuid v4 only overwrites the
          // version/variant bits in bytes 6 and 8, so the prefix survives
          // into the id and fixes lexicographic order = creation order.
          bytes[i] = i < 4 ? (calls >>> (8 * (3 - i))) & 0xff : 0;
        }
      }
      return array;
    };
    crypto.randomUUID = () => {
      const b = crypto.getRandomValues(new Uint8Array(16));
      b[6] = (b[6] & 0x0f) | 0x40;
      b[8] = (b[8] & 0x3f) | 0x80;
      const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
      return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(
        16,
        20
      )}-${h.slice(20)}`;
    };
  });
});

const viewports = [
  ["desktop", { width: 1324, height: 745 }],
  ["tablet", { width: 900, height: 745 }],
  ["mobile", { width: 390, height: 844 }],
] as const;

for (const [label, viewport] of viewports) {
  test.describe(`fidelity ${label}`, () => {
    test.use({ viewport });

    test(`home ${label}`, async ({ homePage, dataSamplesPage, page }) => {
      await homePage.goto();
      await screenshot(page, `home-empty--${label}`);
      await homePage.importProject("test-data/dataset.json");
      // "How CreateAI works" dialog shown when opening the imported project.
      await expect(modalDialog(page)).toBeVisible();
      await screenshot(page, `how-it-works-dialog--${label}`);
      await dataSamplesPage.welcomeDialog.close();
      await homePage.goto();
      await homePage.expectProjectVisible("Untitled");
      await screenshot(page, `home-with-project--${label}`);
    });

    test(`data samples with recordings ${label}`, async ({
      homePage,
      dataSamplesPage,
      page,
    }) => {
      await homePage.goto();
      await homePage.importProject("test-data/dataset.json");
      await dataSamplesPage.expectOnPage();
      await dataSamplesPage.expectActions(["active", "inactive"]);
      await screenshot(page, `data-samples-with-recordings--${label}`);
    });

    test(`testing model ${label}`, async ({
      homePage,
      dataSamplesPage,
      testModelPage,
      page,
    }) => {
      await homePage.goto();
      await homePage.importProject("test-data/dataset.json");
      await dataSamplesPage.expectOnPage();
      const trainModelDialog = await dataSamplesPage.trainModel();
      await trainModelDialog.train();
      await testModelPage.expectOnPage();
      await testModelPage.expectDefaultCodeView();
      await screenshot(page, `testing-model--${label}`, liveGraph(page));
    });

    test(`projects page ${label}`, async ({
      homePage,
      dataSamplesPage,
      projectsPage,
      page,
    }) => {
      await homePage.goto();
      await homePage.importProject("test-data/dataset.json");
      await dataSamplesPage.expectOnPage();
      await projectsPage.goto();
      await projectsPage.expectOnPage();
      await projectsPage.expectProjectCount(1);
      await screenshot(page, `projects-page--${label}`);
    });
  });
}

test.describe("fidelity desktop states", () => {
  test.use({ viewport: { width: 1324, height: 745 } });

  test("home dialogs and menus", async ({ homePage, page }) => {
    await homePage.goto();
    await page.getByRole("button", { name: "New project" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await screenshot(page, "home-new-project-dialog");
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Settings actions menu" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await screenshot(page, "settings-menu");
    await page.getByRole("menuitem", { name: "Settings" }).click();
    await screenshot(page, "settings-dialog");
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Settings actions menu" }).click();
    await page.getByRole("menuitem", { name: "Language" }).click();
    await screenshot(page, "language-dialog");
    // Choosing a partially supported language closes the dialog and fires the
    // info toast. Welsh has no UI translation so the app stays in English.
    await page.getByTestId("cy").click();
    const toast = page.getByText("Language not fully supported");
    await expect(toast).toBeVisible();
    await screenshot(page, "language-toast");
    await page.getByRole("button", { name: "Close" }).click();
    await expect(toast).not.toBeVisible();

    await page.getByRole("button", { name: "Help" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await screenshot(page, "help-menu");
    await page.getByRole("menuitem", { name: "About" }).click();
    await screenshot(page, "about-dialog");
    await page.keyboard.press("Escape");
  });

  test("home project card menu", async ({
    homePage,
    dataSamplesPage,
    page,
  }) => {
    await homePage.goto();
    await homePage.importProject("test-data/dataset.json");
    await dataSamplesPage.expectOnPage();
    await homePage.goto();
    await homePage.openCardMenu("Untitled");
    await expect(page.getByRole("menu")).toBeVisible();
    await screenshot(page, "home-card-menu");
  });

  test("projects page states", async ({
    homePage,
    dataSamplesPage,
    projectsPage,
    page,
  }) => {
    await homePage.goto();
    await projectsPage.goto();
    await projectsPage.expectNoProjects();
    await screenshot(page, "projects-page-empty");

    await homePage.goto();
    await homePage.importProject("test-data/dataset.json");
    await dataSamplesPage.expectOnPage();
    await projectsPage.goto();
    await projectsPage.expectProjectCount(1);

    await projectsPage.openCardMenu("Untitled");
    await expect(page.getByRole("menu")).toBeVisible();
    await screenshot(page, "projects-card-menu");
    await page.keyboard.press("Escape");

    await projectsPage.selectProject("Untitled");
    await projectsPage.expectToolbarVisible();
    await screenshot(page, "projects-selection-toolbar");

    await page
      .getByRole("button", { name: /Delete/ })
      .first()
      .click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await screenshot(page, "projects-delete-dialog");
    await page.keyboard.press("Escape");
  });

  test("data samples menus and train dialog", async ({
    homePage,
    dataSamplesPage,
    page,
  }) => {
    await homePage.goto();
    await homePage.importProject("test-data/dataset.json");
    await dataSamplesPage.expectOnPage();

    await page.getByLabel("Data actions").click();
    await expect(page.getByRole("menu")).toBeVisible();
    await screenshot(page, "data-samples-menu");
    await page.keyboard.press("Escape");

    await dataSamplesPage.trainModel();
    await screenshot(page, "train-model-dialog");
  });

  test("connect flow, tour and connected state", async ({
    homePage,
    dataSamplesPage,
    page,
  }) => {
    await homePage.goto();
    await homePage.newProject();
    const connectionDialogs = await dataSamplesPage.connect();

    await connectionDialogs.waitForText(bluetooth.whatYouNeed);
    await screenshot(page, "connect-what-you-need");
    await connectionDialogs.clickNext();

    await connectionDialogs.waitForText(bluetooth.connectUsb);
    await screenshot(page, "connect-usb");
    await connectionDialogs.clickNext();

    await connectionDialogs.waitForText(bluetooth.download);
    await screenshot(page, "connect-download-program");
    await connectionDialogs.clickNext();

    await connectionDialogs.waitForText(bluetooth.connectBattery);
    await screenshot(page, "connect-battery");
    await connectionDialogs.clickNext();

    await connectionDialogs.waitForText(bluetooth.copyPattern);
    await screenshot(page, "connect-pattern-empty");
    await connectionDialogs.enterBluetoothPattern();
    await screenshot(page, "connect-pattern-entered");
    await connectionDialogs.clickNext();

    await connectionDialogs.waitForText(bluetooth.connectBluetooth);
    await screenshot(page, "connect-bluetooth");
    await connectionDialogs.clickNext();

    // The Connect tour auto-appears on first successful connection.
    await expect(
      page.getByText("Your data collection micro:bit is connected!")
    ).toBeVisible({ timeout: 10_000 });
    await screenshot(page, "tour-connect-step-1", liveGraph(page));
    await page.getByRole("button", { name: "Next (1/3)" }).click();
    await screenshot(page, "tour-connect-step-2", liveGraph(page));
    await page.getByRole("button", { name: "Next (2/3)" }).click();
    await screenshot(page, "tour-connect-step-3", liveGraph(page));
    await page.getByRole("button", { name: "Close" }).click();

    await dataSamplesPage.expectConnected();
    await screenshot(page, "data-samples-connected", liveGraph(page));
  });
});

test.describe("fidelity drawer", () => {
  test.use({ viewport: { width: 900, height: 745 } });

  test("navigation drawer", async ({ homePage, page }) => {
    await homePage.goto();
    await page.getByRole("button", { name: "Main menu" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await screenshot(page, "drawer--tablet");
  });
});
