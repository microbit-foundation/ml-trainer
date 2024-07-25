<!--
  (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import * as tfvis from '@tensorflow/tfjs-vis';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import BottomPanel from '../components/bottom/BottomPanel.svelte';
  import GestureTilePart from '../components/GestureTilePart.svelte';
  import Information from '../components/information/Information.svelte';
  import PleaseConnectFirst from '../components/PleaseConnectFirst.svelte';
  import Recording from '../components/Recording.svelte';
  import StandardButton from '../components/StandardButton.svelte';
  import { t } from '../i18n';
  import { makeInputs, ModelSettings } from '../script/ml';
  import {
    getPrevData,
    RecordingData,
    removeRecording,
    settings,
  } from '../script/stores/mlStore';
  import { gestures } from '../script/stores/Stores';
  import { areActionsAllowed, state } from '../script/stores/uiStore';
  import TabView from '../views/TabView.svelte';

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

  // Delete recording from recordings array
  function deleteRecording(gestureId: number, recording: RecordingData) {
    if (!areActionsAllowed(false)) {
      return;
    }
    $state.isPredicting = false;
    removeRecording(gestureId, recording.ID);
  }

  $: hasSomeData = (): boolean => {
    if ($gestures.length === 0) {
      return false;
    }
    return $gestures.some(gesture => gesture.recordings.length > 0);
  };

  let showProcessedData = false;
  const processData = () => {
    showProcessedData = true;
  };
  const hideProcessedData = () => {
    showProcessedData = false;
  };
</script>

<div class="flex flex-col h-full inline-block w-full bg-backgrounddark">
  <TabView />
  <main class="contents">
    <h1 class="sr-only">Process data</h1>

    {#if !hasSomeData() && !$state.isInputConnected}
      <div class="flex justify-center items-center flex-grow">
        <PleaseConnectFirst />
      </div>
    {:else}
      <div class="flex flex-col flex-grow">
        <div
          class="grid grid-cols-[200px,1fr] gap-x-7 items-center flex-shrink-0 h-13 px-10 z-3 border-b-3 border-gray-200 sticky top-0 bg-backgrounddark">
          <Information
            isLightTheme={false}
            underlineIconText={false}
            iconText={$t('content.data.classification')}
            titleText={$t('content.data.classHelpHeader')}
            bodyText={$t('content.data.classHelpBody')} />
          <Information
            isVisible={$gestures.some(g => g.name.trim() || g.recordings.length > 0)}
            isLightTheme={false}
            underlineIconText={false}
            iconText={$t('content.data.data')}
            titleText={$t('content.data.data')}
            bodyText={$t('content.data.dataDescription')} />
        </div>
        <div
          class="grid grid-cols-[200px,1fr] auto-rows-max gap-x-7 gap-y-3 py-2 px-10 flex-grow flex-shrink h-0 overflow-y-auto">
          {#each $gestures as gesture (gesture.ID)}
            <section class="contents">
              <GestureTilePart small elevated>
                <div
                  class="flex items-center justify-between py-2 px-6 w-50 h-30 relative">
                  <h3>
                    {gesture.name}
                  </h3>
                </div>
              </GestureTilePart>
              <div
                class="max-w-max {gesture.name && gesture.recordings.length
                  ? 'visible'
                  : 'invisible'}">
                <GestureTilePart small elevated>
                  <div class="h-full flex items-center gap-x-3 p-2">
                    {#if gesture.recordings.length}
                      {#each gesture.recordings as recording (String(gesture.ID) + String(recording.ID))}
                        <div
                          class="h-full flex flex-col w-40 relative overflow-hidden transition-all duration-1000"
                          class:w-80={showProcessedData}>
                          <Recording
                            gestureId={gesture.ID}
                            gestureName={gesture.name}
                            {recording}
                            fullWidth={true}
                            showFingerprint
                            {showProcessedData}
                            onDelete={deleteRecording} />
                        </div>
                      {/each}
                    {/if}
                  </div>
                </GestureTilePart>
              </div>
            </section>
          {/each}
        </div>
      </div>
    {/if}
    <div
      class="flex items-center justify-end px-10 py-2 border-b-3 border-t-3 border-gray-200">
      <StandardButton type="primary" onClick={processData}>Process data</StandardButton>
    </div>
    <div class="h-160px w-full">
      <BottomPanel showFingerprint />
    </div>
  </main>
</div>
