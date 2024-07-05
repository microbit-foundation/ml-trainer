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

  export let width: number;
  let surface: undefined | tfvis.Drawable;
  $: prevData = getPrevData();
  const filters = Array.from(get(settings).includedFilters);

  const mlSettings = get(settings);
  const modelSettings: ModelSettings = {
    axes: mlSettings.includedAxes,
    filters: mlSettings.includedFilters,
  };

  const filtersLabels: string[] = [];
  filters.forEach(filter => {
    filtersLabels.push(`${filter}-x`, `${filter}-y`, `${filter}-z`);
  });

  const disconnectedData = new Array(filtersLabels.length).fill(0);

  onMount(() => {
    const interval = setInterval(() => {
      prevData = getPrevData();

      if (surface) {
        const currentGestureData = prevData
          ? makeInputs(modelSettings, prevData, 'computeNormalizedOutput')
          : disconnectedData;
        const currentData = {
          values: [currentGestureData],
          xTickLabels: filtersLabels,
          yTickLabels: ['Live'],
        };
        tfvis.render.heatmap(surface, currentData, {
          colorMap: 'viridis',
          height: 89,
          width: width + 44,
          rowMajor: true,
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

<div class="relative w-full h-full flex-grow">
  <div class="absolute h-full w-full top-0 -left-8px">
    <div bind:this={surface}></div>
  </div>
</div>
