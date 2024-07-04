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
  export let gestureName: string;

  let surface: undefined | tfvis.Drawable;

  const mlSettings = get(settings);
  const modelSettings: ModelSettings = {
    axes: mlSettings.includedAxes,
    filters: mlSettings.includedFilters,
  };

  const filtersLabels: string[] = [];
  modelSettings.filters.forEach(filter => {
    filtersLabels.push(`${filter}-x`, `${filter}-y`, `${filter}-z`);
  });

  const processedData = makeInputs(
    modelSettings,
    recordingData.data,
    'computeNormalizedOutput',
  );

  const chartData = {
    values: [processedData],
    xTickLabels: filtersLabels,
    yTickLabels: [gestureName],
  };

  onMount(() => {
    if (surface) {
      tfvis.render.heatmap(surface, chartData, {
        colorMap: 'viridis',
        height: 20,
        width: 204,
        rowMajor: true,
        domain: [0, 1],
        fontSize: 0,
      });
    }
  });
</script>

<div class="relative h-20px w-full">
  <div class="absolute h-20px w-full -bottom-8px -left-8px">
    <div bind:this={surface}></div>
  </div>
</div>
