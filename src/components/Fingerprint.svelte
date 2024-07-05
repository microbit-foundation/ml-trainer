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

  export let recordingData: RecordingData | undefined;
  export let gestureName: string;
  export let averagedData: number[] = [];
  export let height: 'small' | 'half' | 'full' = 'small';

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

  const getProcessedData = () =>
    recordingData
      ? makeInputs(modelSettings, recordingData.data, 'computeNormalizedOutput')
      : [];

  const chartData = {
    values: recordingData ? [getProcessedData()] : [averagedData],
    xTickLabels: filtersLabels,
    yTickLabels: [gestureName],
  };

  onMount(() => {
    if (surface) {
      tfvis.render.heatmap(surface, chartData, {
        colorMap: 'viridis',
        height: height === 'small' ? 29 : height === 'half' ? 60 : 111,
        width: 204,
        rowMajor: true,
        domain: [0, 1],
        fontSize: 0,
      });
    }
  });
</script>

<div
  class="relative w-full"
  class:h-11px={height === 'small'}
  class:h-42px={height === 'half'}
  class:h-102px={height === 'full'}>
  <div
    class="absolute w-full -bottom-9px top-0 -left-8px"
    class:h-11px={height === 'small'}
    class:h-42px={height === 'half'}
    class:h-102px={height === 'full'}>
    <div bind:this={surface}></div>
  </div>
</div>
