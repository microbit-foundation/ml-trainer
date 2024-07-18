/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import {
  getHighlightedColumns,
  transformColumnsToMatrix,
  transformMatrixToColumns,
  updateMatrixColumns,
} from "./bt-pattern-matrix-utils";

describe("transformMatrixToColumns", () => {
  test("2 x 2", () => {
    const dim = 2;
    const matrix = [1, 2, 3, 4];
    const columns = [
      [1, 3],
      [2, 4],
    ];
    expect(transformMatrixToColumns(matrix, dim)).toEqual(columns);
  });
});

describe("transformColumnsToMatrix", () => {
  test("2 x 2", () => {
    const matrix = [1, 2, 3, 4];
    const columns = [
      [1, 3],
      [2, 4],
    ];
    expect(transformColumnsToMatrix(columns)).toEqual(matrix);
  });
});

describe("getHighlightedColumns", () => {
  test("cell position is above lit up cell", () => {
    const matrixColumns = [
      [false, false, true],
      [false, false, false],
      [false, false, false],
    ];
    const cellPos = { colIdx: 0, rowIdx: 0 };
    const highlightedColumns = [
      [true, true, false],
      [false, false, false],
      [false, false, false],
    ];
    expect(getHighlightedColumns(matrixColumns, cellPos)).toEqual(
      highlightedColumns
    );
  });
  test("cell position is below lit up cell", () => {
    const matrixColumns = [
      [true, true, true],
      [false, false, false],
      [false, false, false],
    ];
    const cellPos = { colIdx: 0, rowIdx: 2 };
    const highlightedColumns = [
      [true, true, false],
      [false, false, false],
      [false, false, false],
    ];
    expect(getHighlightedColumns(matrixColumns, cellPos)).toEqual(
      highlightedColumns
    );
  });
  test("cell position is on lit up cell", () => {
    const matrixColumns = [
      [false, true, true],
      [false, false, false],
      [false, false, false],
    ];
    const cellPos = { colIdx: 0, rowIdx: 1 };
    const highlightedColumns = [
      [false, false, false],
      [false, false, false],
      [false, false, false],
    ];
    expect(getHighlightedColumns(matrixColumns, cellPos)).toEqual(
      highlightedColumns
    );
  });
});

describe("updateMatrixColumns", () => {
  test("cell position is above lit up cell", () => {
    const matrixColumns = [
      [false, false, true],
      [false, false, true],
      [false, false, true],
    ];
    const cellPos = { colIdx: 1, rowIdx: 0 };
    const newMatrixColumns = [
      [false, false, true],
      [true, true, true],
      [false, false, true],
    ];
    expect(updateMatrixColumns(matrixColumns, cellPos)).toEqual(
      newMatrixColumns
    );
  });
  test("cell position is below lit up cell", () => {
    const matrixColumns = [
      [false, false, true],
      [true, true, true],
      [false, false, true],
    ];
    const cellPos = { colIdx: 1, rowIdx: 2 };
    const newMatrixColumns = [
      [false, false, true],
      [false, false, true],
      [false, false, true],
    ];
    expect(updateMatrixColumns(matrixColumns, cellPos)).toEqual(
      newMatrixColumns
    );
  });
  test("cell position is on lit up cell", () => {
    const matrixColumns = [
      [false, false, true],
      [false, false, true],
      [false, false, true],
    ];
    const cellPos = { colIdx: 0, rowIdx: 2 };
    expect(updateMatrixColumns(matrixColumns, cellPos)).toEqual(matrixColumns);
  });
});
