/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { type Page } from "@playwright/test";

const numCols = 5;

/**
 * Test id of the pattern option that lights `numLeds` LEDs in the given column
 * (0-based), matching `data-testid` in BluetoothPatternInput. Uses test ids
 * rather than labels since the accessible copy may change.
 */
const ledOptionTestId = (colIdx: number, numLeds: number): string =>
  `bluetooth-pattern-led-${colIdx}-${numLeds}`;

/**
 * Select the pattern option that lights `numLeds` LEDs in the given column
 * (0-based). Each column is a radio group and each LED is an option; a count of
 * 0 leaves the column unset. The radio input is visually hidden, so the test id
 * sits on the wrapping label, which toggles it when clicked.
 */
export const selectPatternColumn = async (
  page: Page,
  colIdx: number,
  numLeds: number
): Promise<void> => {
  if (numLeds <= 0) {
    return;
  }
  await page.getByTestId(ledOptionTestId(colIdx, numLeds)).click();
};

/**
 * Get the number of lit LEDs in each of the five pattern columns as strings
 * (e.g. ["1", "2", "3", "4", "5"]), or "0" for an unset column.
 */
export const getPatternColumnValues = async (page: Page): Promise<string[]> => {
  const values: string[] = [];
  for (let colIdx = 0; colIdx < numCols; colIdx++) {
    let value = "0";
    for (let numLeds = 1; numLeds <= numCols; numLeds++) {
      const radio = page
        .getByTestId(ledOptionTestId(colIdx, numLeds))
        .getByRole("radio");
      if (await radio.isChecked()) {
        value = numLeds.toString();
        break;
      }
    }
    values.push(value);
  }
  return values;
};
