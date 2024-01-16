<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<style>
  .buttonGrid {
    display: grid;
    grid-template-columns: repeat(5, 19%);
    grid-template-rows: repeat(5, 19%);
    gap: 2px 2px;
    grid-template-areas:
      '. . . . .'
      '. . . . .'
      '. . . . .'
      '. . . . .'
      '. . . . .';
    height: 150px;
    width: 150px;
  }
  .turnedOn {
    animation: turnOn 0.3s ease;
  }

  .turnedOff {
    animation: turnOff 0.3s ease;
  }

  @keyframes turnOn {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.15);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes turnOff {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(0.8);
    }
    100% {
      transform: scale(1);
    }
  }
</style>

<script lang="ts">
  export let onMatrixChange: (matrix: boolean[]) => void;
  export let matrix: boolean[];

  let highlighted: boolean[] = new Array<boolean>(25).fill(false);

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
</script>

<!-- PATTERN MATRIX -->
<div class="buttonGrid select-none" on:mouseleave={mouseLeftDrawingArea}>
  <!-- Draw all 25 boxes -->
  {#each matrix as isOn, i}
    <div
      class="rounded"
      class:border-3={highlighted[i]}
      class:turnedOn={isOn}
      class:turnedOff={!isOn}
      class:bg-secondary={isOn}
      class:border-secondary={highlighted[i]}
      class:bg-gray-300={!isOn}
      on:mousedown={() => {
        setElement(i, true);
      }}
      on:mouseenter={e => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        elementHover(i, e);
      }} />
  {/each}
</div>
