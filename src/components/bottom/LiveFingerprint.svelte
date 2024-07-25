<!--
  (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import * as tfvis from '@tensorflow/tfjs-vis';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { makeInputs, ModelSettings } from '../../script/ml';
  import { getPrevData, settings } from '../../script/stores/mlStore';
  import { state } from '../../script/stores/uiStore';

  let surface: undefined | tfvis.Drawable;
  $: prevData = getPrevData();
  const filters = Array.from(get(settings).includedFilters);

  const mlSettings = get(settings);
  const modelSettings: ModelSettings = {
    axes: mlSettings.includedAxes,
    filters: mlSettings.includedFilters,
  };

  const filtersLabels: string[] = [];
  modelSettings.filters.forEach(filter => {
    filtersLabels.push(filter);
  });

  const disconnectedData: number[][] = [];
  for (let i = 0; i < filters.length * 3; i += 3) {
    disconnectedData.push([0, 0, 0]);
  }

  const getProcessedData = (prevData: { x: number[]; y: number[]; z: number[] }) => {
    const result = [];
    const singleArr = makeInputs(modelSettings, prevData, 'computeNormalizedOutput');
    for (let i = 0; i < singleArr.length; i += 3) {
      result.push(singleArr.slice(i, i + 3));
    }
    return result;
  };

  onMount(() => {
    const interval = setInterval(() => {
      prevData = getPrevData();

      if (surface) {
        const currentGestureData = prevData
          ? getProcessedData(prevData)
          : disconnectedData;
        const currentData = {
          values: currentGestureData,
          xTickLabels: filtersLabels,
          yTickLabels: ['x', 'y', 'z'],
        };
        tfvis.render.heatmap(surface, currentData, {
          colorMap: 'viridis',
          height: 166,
          width: 216,
          domain: [0, 1],
          fontSize: 0,
        });
      }
    });
    return () => {
      clearInterval(interval);
    };
  });
</script>

<div class="relative w-40 h-full z-0">
  <div class="absolute h-full w-full top-0 -left-10px right-0 bottom-0">
    <div bind:this={surface}></div>
  </div>
</div>
