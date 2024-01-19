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
  import PatternBox from './PatternBox.svelte';
  import PatternColumnInput from './PatternColumnInput.svelte';

  export let onMatrixChange: (matrix: boolean[]) => void;
  export let matrix: boolean[];

  let highlightedColumns: boolean[][] = new Array<boolean[]>(5).fill(
    new Array<boolean>(5).fill(false),
  );
  const matrixDimension = 5;

  const transformMatrixToColumns = (m: boolean[]) => {
    const cols = [];
    for (let colId = 1; colId <= matrixDimension; colId++) {
      const remainder = colId === matrixDimension ? 0 : colId;
      cols.push(m.filter((_c, i) => (i + 1) % matrixDimension === remainder));
    }
    return cols;
  };

  const transformColumnsToMatrix = (cols: boolean[][]) => {
    let matrix: boolean[] = [];
    for (let i = 0; i < matrixDimension; i++) {
      matrix = [...matrix, ...cols.map(c => c[i])];
    }
    return matrix;
  };

  $: matrixColumns = transformMatrixToColumns(matrix);

  const clearHighlightedColumns = () => {
    highlightedColumns = highlightedColumns.map(col => col.fill(false));
  };

  const updateHighlightedColumns = (colIdx: number, rowIdx: number) => {
    const col = matrixColumns[colIdx];
    const highlightedCol = col.map(
      (isOn, idx) => (!isOn && rowIdx <= idx) || (isOn && rowIdx > idx),
    );
    highlightedColumns[colIdx] = highlightedCol;
  };

  const updateMatrixColumns = (colIdx: number, rowIdx: number) => {
    const newCol = Array(matrixDimension).fill(false).fill(true, rowIdx);
    const columns = [
      ...matrixColumns.slice(0, colIdx),
      newCol,
      ...matrixColumns.slice(colIdx + 1),
    ];
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
      updateMatrixColumns(colIdx, matrixDimension - value);
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
            updateMatrixColumns(colIdx, rowIdx);
          }}
          on:mouseenter={() => {
            updateHighlightedColumns(colIdx, rowIdx);
          }}
          on:mouseleave={clearHighlightedColumns} />
      {/each}
      <PatternColumnInput
        {colIdx}
        on:keydown={e => {
          onKeyDownColumnInput(e, colIdx);
        }}
        value={column.filter(c => c).length} />
    </div>
  {/each}
</div>
