<!--
  (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import * as tfvis from '@tensorflow/tfjs-vis';
  import { onMount } from 'svelte';
  import { gestures } from '../script/stores/Stores';
  import { get } from 'svelte/store';
  import { getPrevData, settings } from '../script/stores/mlStore';
  import { makeInputs, ModelSettings } from '../script/ml';
  import TabView from '../views/TabView.svelte';
  import { state } from '../script/stores/uiStore';
  import BottomPanel from '../components/bottom/BottomPanel.svelte';
  import LoadingAnimation from '../components/LoadingBlobs.svelte';

  let surfaceAll: undefined | tfvis.Drawable;
  let surfaceCurrent: undefined | tfvis.Drawable;
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
  const allData = $gestures.map(g => {
    const inputData: number[][] = [];
    g.recordings.forEach(r => {
      inputData.push(makeInputs(modelSettings, r.data, 'computeNormalizedOutput'));
    });
    const averagedData: number[] = [];
    for (let i = 0; i < filters.length * 3; i++) {
      let filterValues: number[] = [];
      inputData.forEach(d => {
        filterValues.push(d[i]);
      });
      averagedData.push(filterValues.reduce((a, b) => a + b, 0) / filterValues.length);
    }
    return averagedData;
  });

  const data = {
    values: allData,
    xTickLabels: filtersLabels,
    yTickLabels: $gestures.map(g => g.name),
  };

  onMount(() => {
    const renderAllDataHeatmap = () => {
      if (surfaceAll) {
        tfvis.render.heatmap(surfaceAll, data, {
          colorMap: 'viridis',
          height: 250,
          rowMajor: true,
          domain: [0, 1],
        });
      }
    };

    renderAllDataHeatmap();

    window.addEventListener('resize', renderAllDataHeatmap);

    const interval = setInterval(() => {
      prevData = getPrevData();

      if (surfaceCurrent && prevData) {
        const currentGestureData = makeInputs(
          modelSettings,
          prevData,
          'computeNormalizedOutput',
        );
        const currentData = {
          values: [currentGestureData],
          xTickLabels: filtersLabels,
          yTickLabels: ['Live'],
        };
        tfvis.render.heatmap(surfaceCurrent, currentData, {
          colorMap: 'viridis',
          height: 120,
          rowMajor: true,
          domain: [0, 1],
        });
      }
    });
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', renderAllDataHeatmap);
    };
  });
</script>

<div class="flex flex-col h-full inline-block w-full bg-backgrounddark">
  <TabView />
  <main class="contents">
    <h1 class="sr-only">Process data</h1>
    <div class="flex flex-col flex-grow items-center h-0 overflow-y-auto">
      <div class="p-5 flex-grow flex flex-col gap-5 w-3/4">
        <div class="flex flex-col gap-2">
          <h2 class="font-semibold">All recordings</h2>
          <p>The mean of the filters applied to all recordings for each action</p>
          <div class="bg-white p-5 rounded-lg w-full">
            <div bind:this={surfaceAll}></div>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <h2 class="font-semibold">Current action</h2>
          <p>Filters applied to the live data</p>
          <div class="bg-white p-5 min-h-160px rounded-lg w-full">
            {#if $state.isInputConnected && prevData}
              <div bind:this={surfaceCurrent}></div>
            {:else if $state.isInputConnected && !prevData}
              <div class="flex justify-center items-center h-full">
                <LoadingAnimation />
              </div>
            {:else}
              <div class="flex justify-center items-center h-full">
                <p>Connect your micro:bit view live data</p>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
    <div class="h-160px w-full">
      <BottomPanel />
    </div>
  </main>
</div>
