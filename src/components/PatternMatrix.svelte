<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<style>
  .buttonGrid {
    display: grid;
    grid-template-columns: repeat(5, 19%);
    gap: 2px 2px;
    grid-template-areas: '. . . . .';
    height: 150px;
    width: 150px;
  }

  .buttonColumn {
    display: grid;
    grid-template-columns: repeat(1, 19%);
    grid-template-rows: repeat(6, 19%);
    gap: 2px 2px;
    grid-template-areas:
      '.'
      '.'
      '.'
      '.'
      '.';
    height: 150px;
    width: 150px;
  }
</style>

<script lang="ts">
  import {
    generateMatrix,
    getHighlightedColumns,
    transformColumnsToMatrix,
    transformMatrixToColumns,
    updateMatrixColumns,
  } from '../script/patternMatrixTransforms';
  import PatternBox from './PatternBox.svelte';
  import PatternColumnInput from './PatternColumnInput.svelte';

  export let onMatrixChange: (matrix: boolean[]) => void;
  export let matrix: boolean[];
  export let invalid: boolean = false;

  const matrixDimension = 5;
  let highlightedColumns: boolean[][] = generateMatrix(matrixDimension, false);
  $: matrixColumns = transformMatrixToColumns(matrix, matrixDimension);

  const clearHighlightedColumns = () => {
    highlightedColumns = generateMatrix(matrixDimension, false);
  };

  const updateMatrix = (colIdx: number, rowIdx: number) => {
    const columns = updateMatrixColumns(matrixColumns, { colIdx, rowIdx });
    matrix = transformColumnsToMatrix(columns);
    onMatrixChange(matrix);
  };

  const getNewValue = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
      const target = e.target as HTMLInputElement;
      const prevValue = parseInt(target.value);
      return e.key === 'ArrowUp' ? prevValue + 1 : prevValue - 1;
    }
    return parseInt(e.key);
  };

  const onKeyDownColumnInput = (e: KeyboardEvent, colIdx: number) => {
    if (['Tab', 'Enter'].includes(e.key)) {
      return;
    }
    e.preventDefault();
    const value = getNewValue(e);
    if (value < matrixDimension + 1 && value > 0) {
      updateMatrix(colIdx, matrixDimension - value);
    }
  };
</script>

<!-- PATTERN MATRIX -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- Opted for number input method for accessible method of filling in the pattern -->
<div class="buttonGrid select-none">
  <!-- Draw all 25 boxes -->
  {#each matrixColumns as column, colIdx}
    <div class="buttonColumn">
      {#each column as isOn, rowIdx}
        <PatternBox
          {isOn}
          isHighlighted={highlightedColumns[colIdx][rowIdx]}
          on:mousedown={() => {
            clearHighlightedColumns();
            updateMatrix(colIdx, rowIdx);
          }}
          on:mouseenter={() => {
            highlightedColumns = getHighlightedColumns(matrixColumns, { colIdx, rowIdx });
          }}
          on:mouseleave={clearHighlightedColumns} />
      {/each}
      <PatternColumnInput
        aria-invalid={invalid && column.filter(c => c).length === 0}
        {colIdx}
        on:keydown={e => {
          onKeyDownColumnInput(e, colIdx);
        }}
        value={column.filter(c => c).length} />
    </div>
  {/each}
</div>
