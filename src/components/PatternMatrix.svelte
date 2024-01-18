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
  import { t } from './../i18n';
  import PatternBox from './PatternBox.svelte';
  import PatternColumnInput from './PatternColumnInput.svelte';

  export let onMatrixChange: (matrix: boolean[]) => void;
  export let matrix: boolean[];

  let highlighted: boolean[] = new Array<boolean>(25).fill(false);
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

  /** If bad matrix given to component => reset */
  // This should never happen
  if (!(matrix instanceof Array) || matrix.length !== 25) {
    matrix = new Array<boolean>(25);
    for (let i = 0; i < 25; i++) {
      matrix[i] = false;
    }
  }

  const setElement = (i: number, state: boolean): void => {
    matrix[i] = state;
    const effectedSquares = getColumnOf(i);

    effectedSquares.forEach(value => {
      if (value.position <= 0) {
        matrix[value.index] = state;
      } else {
        matrix[value.index] = false;
      }
    });

    onMatrixChange(matrix);
  };

  type PairingSquare = {
    index: number;
    position: number;
  };

  const getColumnOf = (inx: number): PairingSquare[] => {
    const result = [];
    for (let j = inx % 5; j < 25; j += 5) {
      result.push({ index: j, position: Math.sign(inx - j) });
    }
    return result;
  };

  const mouseLeftDrawingArea = () => {
    for (let j = 0; j < highlighted.length; j++) {
      highlighted[j] = false;
    }
  };

  const elementHover = (i: number, mouseEvent: MouseEvent | undefined = undefined) => {
    const affectedColumns = getColumnOf(i);
    for (let j = 0; j < highlighted.length; j++) {
      highlighted[j] = false;
    }
    affectedColumns.forEach(value => {
      highlighted[value.index] = value.position <= 0;
    });

    if (mouseEvent !== undefined && mouseEvent.buttons === 1) {
      setElement(i, true);
    }
  };

  $: matrixColumns = transformMatrixToColumns(matrix);

  const onChangeColumnInput = (e: Event, colIdx: number) => {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value);
    const allFalse = Array(matrixDimension).fill(false);
    const newColumn = allFalse.fill(true, matrixDimension - value);
    const columns = [
      ...matrixColumns.slice(0, colIdx),
      newColumn,
      ...matrixColumns.slice(colIdx + 1),
    ];
    matrix = transformColumnsToMatrix(columns);
  };
</script>

<!-- PATTERN MATRIX -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- Opted for number input method for accessible method of filling in the pattern -->
<div class="buttonGrid select-none" on:mouseleave={mouseLeftDrawingArea}>
  <!-- Draw all 25 boxes -->
  {#each matrixColumns as column, colIdx}
    <div class="buttonColumn">
      {#each column as isOn, rowIdx}
        <PatternBox
          {isOn}
          isHighlighted={highlighted[rowIdx * matrixDimension + colIdx + 1]}
          on:mousedown={() => {
            setElement(rowIdx * matrixDimension + colIdx, true);
          }}
          on:mouseenter={e => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            elementHover(rowIdx * matrixDimension + colIdx + 1, e);
          }} />
      {/each}
      <PatternColumnInput
        {colIdx}
        on:change={e => {
          onChangeColumnInput(e, colIdx);
        }}
        value={column.filter(c => c).length} />
    </div>
  {/each}
</div>
