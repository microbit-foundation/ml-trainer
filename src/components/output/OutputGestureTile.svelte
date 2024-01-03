<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<style>
  input[type='range'] {
    writing-mode: bt-lr;
    appearance: slider-vertical;
    width: 20px;
    background: #13bba4;
  }
</style>

<script lang="ts">
  // IMPORT AND DEFAULTS
  import GestureTilePart from '../GestureTilePart.svelte';
  import Gesture from '../../script/domain/Gesture';

  // Variables for component
  export let gesture: Gesture;

  let sliderValue = $gesture.confidence.requiredConfidence * 100;
  $: {
    gesture.getConfidence().setRequiredConfidence(sliderValue / 100);
  }

  $: active =
    $gesture.confidence.currentConfidence > $gesture.confidence.requiredConfidence;
</script>

<GestureTilePart>
  <div class="items-center h-full my-auto justify-between flex p-2">
    <div
      class="w-36 text-center font-semibold rounded-xl
                    px-1 py-1 border border-gray-300
                    border-dashed mr-2 break-words">
      <h3>{$gesture.name}</h3>
    </div>

    <!-- METER -->
    <div class="flex">
      <input
        class="h-25 rotate-90 accent-primary"
        type="range"
        name=""
        min="10"
        max="90"
        id=""
        bind:value={sliderValue} />
      <div class="w-4 h-25 relative">
        <div
          class="w-4 h-full absolute rounded border border-solid border-gray-400 overflow-hidden">
          <div
            class="absolute w-5
            {active ? 'bg-primary' : 'bg-info'}
              z-index: -10"
            style="height: {100 *
              $gesture.confidence.currentConfidence}px; margin-top: {100 -
              100 * $gesture.confidence.currentConfidence}px;" />
          <div
            class="absolute w-5 bg-primary"
            style="height: 1px; margin-top: {6.5 -
              0.068 * $gesture.confidence.requiredConfidence * 100}rem;" />
          <div class="absolute">
            {#each [75, 50, 25] as line}
              <div class="w-5 bg-gray-300 mt-6" style="height: 1px;">
                <p class="absolute text-xs" style="margin-top: -8px; margin-left: 18px;">
                  {line}%
                </p>
              </div>
            {/each}
          </div>
          <div />
        </div>
      </div>
    </div>
  </div>
</GestureTilePart>
