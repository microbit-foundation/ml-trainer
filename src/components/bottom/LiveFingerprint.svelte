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
          xTickLabels: ['Live'],
          yTickLabels: filtersLabels,
        };
        tfvis.render.heatmap(surface, currentData, {
          colorMap: 'viridis',
          height: 166,
          width: 160,
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

<div class="relative w-20 h-full z-0">
  <div class="absolute h-full w-full top-0 -left-10px right-0 bottom-0">
    <div bind:this={surface}></div>
  </div>
</div>
