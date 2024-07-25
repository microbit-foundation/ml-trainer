<!--
  (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import * as tfvis from '@tensorflow/tfjs-vis';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { makeInputs, ModelSettings } from '../script/ml';
  import { RecordingData, settings } from '../script/stores/mlStore';

  export let recordingData: RecordingData;

  let surface: undefined | tfvis.Drawable;

  const mlSettings = get(settings);
  const modelSettings: ModelSettings = {
    axes: mlSettings.includedAxes,
    filters: mlSettings.includedFilters,
  };

  const filtersLabels: string[] = [];
  modelSettings.filters.forEach(filter => {
    filtersLabels.push(filter);
  });

  const getProcessedData = () => {
    const result = [];
    const singleArr = makeInputs(
      modelSettings,
      recordingData.data,
      'computeNormalizedOutput',
    );
    for (let i = 0; i < singleArr.length; i += 3) {
      result.push(singleArr.slice(i, i + 3));
    }
    return result;
  };

  const chartData = {
    values: getProcessedData(),
    xTickLabels: filtersLabels,
    yTickLabels: ['x', 'y', 'z'],
  };

  onMount(() => {
    if (surface) {
      tfvis.render.heatmap(surface, chartData, {
        colorMap: 'viridis',
        height: 109,
        width: 206,
        domain: [0, 1],
        fontSize: 0,
      });
    }
  });
</script>

<div class="relative w-160px" class:h-full={!recordingData}>
  <div
    class="absolute h-full w-full -left-10px right-0 -bottom-1px"
    class:top-1px={!recordingData}
    class:top-0={recordingData}>
    <div bind:this={surface}></div>
  </div>
  {#if !recordingData}
    <div class="absolute bg-white h-full w-20px left-34px top-0 bottom-0" />
    <div class="absolute bg-white h-8px w-40px left-0 -bottom-7px" />
  {/if}
</div>
