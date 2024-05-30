<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<style>
  .buttonGrid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr 1fr 1fr;
    gap: 2px 2px;
    grid-template-areas:
      '. . . . .'
      '. . . . .'
      '. . . . .'
      '. . . . .'
      '. . . . .';
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
  import Microbits from '../../script/microbit-interfacing/Microbits';

  // TODO: Shares a lot with 'PatternMatrix'. Extract 'Matrix' component and reuse

  import {
    type GestureData,
    updateGestureLEDOutput,
    getNewMatrix,
    updateGestureMatrix,
  } from '../../script/stores/mlStore';

  type Mode = 'input' | 'output';
  export let mode: Mode = 'output';
  export let editable: boolean = true;

  export const trigger = () => {
    Microbits.getOutputMicrobit()?.setLeds(matrix);
  };

  export let gesture: GestureData;

  $: matrix =
    mode === 'output'
      ? gesture.output?.matrix ?? getNewMatrix()
      : gesture.matrix ?? getNewMatrix();

  // Variable for saving the current type-of-click
  // This helps when users drag to draw on the 5x5 grid
  let setElementTo = true;

  // When clicked. Use setElementTo to remember what elements
  // Should be set to
  function elementClick(i: number) {
    if (editable) {
      setElementTo = !matrix[i];
      matrix[i] = setElementTo;
      mode === 'output'
        ? updateGestureLEDOutput(gesture.ID, matrix)
        : updateGestureMatrix(gesture.ID, matrix);
    }
  }

  // When user hovers over a box. If user is clicking:
  // Set that matrix to true/false depending on last
  // click
  function elementHover(i: number, e: MouseEvent) {
    if (editable) {
      if (e.buttons !== 1) {
        return;
      }
      matrix[i] = setElementTo;
      mode === 'output'
        ? updateGestureLEDOutput(gesture.ID, matrix)
        : updateGestureMatrix(gesture.ID, matrix);
    }
  }
</script>

<div class="buttonGrid h-18 w-18 select-none ml-0">
  <!-- Draw all 25 boxes -->
  {#each matrix as button, i}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="{button ? 'bg-[#FF0000]' : 'bg-gray-300'} rounded-[2px] transition ease"
      class:turnedOn={button}
      class:turnedOff={!button}
      class:cursor-pointer={editable}
      on:mousedown={() => {
        elementClick(i);
      }}
      on:mouseenter={e => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        elementHover(i, e);
      }} />
  {/each}
</div>
