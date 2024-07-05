<style>
  .arrowLeft {
    border-width: 10px;
    border-color: rgba(255, 255, 255, 0);
  }
</style>

<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { currentData } from '../../script/stores/mlStore';
  import { state } from '../../script/stores/uiStore';

  export let halfHeight: boolean = false;
  const heightValue = halfHeight ? 5 : 10;
  $: {
    const data = $currentData;
    const dataInArray = [data.x, data.y, data.z];
    updateDimensionLabels(dataInArray);
  }

  let labels = [
    { label: 'x', arrowHeight: 0, labelHeight: 0, color: '#f9808e', id: 0 },
    { label: 'y', arrowHeight: 0, labelHeight: 0, color: '#80f98e', id: 1 },
    { label: 'z', arrowHeight: 0, labelHeight: 0, color: '#808ef9', id: 2 },
  ];

  function scale(value: number) {
    const newMin = (heightValue / (2.3 + Math.abs(-2.3))) * 0.3;
    const newMax = heightValue - newMin;
    const existingMin = 2;
    const existingMax = -2;
    return (
      ((newMax - newMin) * (value - existingMin)) / (existingMax - existingMin) + newMin
    );
  }

  function updateDimensionLabels(data: number[]) {
    for (let i = 0; i < 3; i++) {
      const value = data[labels[i].id];
      labels[i].arrowHeight = scale(value);
    }
    fixOverlappingLabels();
  }

  function fixOverlappingLabels() {
    labels.sort((a, b) => {
      return a.arrowHeight - b.arrowHeight;
    });

    const height0 = labels[0].arrowHeight;
    const height1 = labels[1].arrowHeight;
    const height2 = labels[2].arrowHeight;

    const MAX_DISTANCE = 1.1;
    const maxDistanceBetweenAll = height2 - height0;

    // If all notes are too close
    if (maxDistanceBetweenAll < MAX_DISTANCE * 2) {
      // Find middle and place labels around them
      const middle = maxDistanceBetweenAll / 2 + height0;
      labels[0].labelHeight = middle - MAX_DISTANCE;
      labels[1].labelHeight = middle;
      labels[2].labelHeight = middle + MAX_DISTANCE;
      return;
    }

    labels[0].labelHeight = height0;
    labels[1].labelHeight = height1;
    labels[2].labelHeight = height2;

    // If a pair are too close.
    for (let i = 0; i < 2; i++) {
      const diff = labels[i + 1].labelHeight - labels[i].labelHeight;
      if (diff > MAX_DISTANCE) continue;

      // Find middle and place labels around middle
      const middle = diff / 2 + labels[i].labelHeight;
      labels[i + 1].labelHeight = middle + MAX_DISTANCE / 2;
      labels[i].labelHeight = middle - MAX_DISTANCE / 2;

      break; // Only one will be close to the other. Otherwise all were too close
    }
  }
</script>

{#if $state.isInputConnected}
  <div class="w-6 relative" class:h-40={!halfHeight} class:h-20={halfHeight}>
    {#each labels as dimension}
      <div
        class="absolute arrowLeft -m-3.5"
        style="transform: translateY({dimension.arrowHeight +
          heightValue /
            16 /
            2}rem) scale(1, 0.75); border-right-color: {dimension.color};" />
      <p
        class="absolute ml-3 text-xl"
        style="transform: translateY({dimension.labelHeight -
          1.75 / 2}rem); color: {dimension.color};">
        {dimension.label}
      </p>
    {/each}
  </div>
{/if}
