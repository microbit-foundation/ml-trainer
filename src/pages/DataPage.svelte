<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import Gesture from '../components/Gesture.svelte';
  import { state } from '../script/stores/uiStore';
  import {
    addGesture,
    clearGestures,
    downloadDataset,
    loadDatasetFromFile,
  } from '../script/stores/mlStore';
  import { t } from '../i18n';
  import NewGestureButton from '../components/NewGestureButton.svelte';
  import PleaseConnectFirst from '../components/PleaseConnectFirst.svelte';
  import Information from '../components/information/Information.svelte';
  import { onMount } from 'svelte';
  import TabView from '../views/TabView.svelte';
  import { gestures } from '../script/stores/Stores';
  import TrainingButton from './training/TrainingButton.svelte';
  import DataPageMenu from '../components/datacollection/DataPageMenu.svelte';
  import BottomPanel from '../components/bottom/BottomPanel.svelte';
  import { Paths, navigate } from '../router/paths';

  let isConnectionDialogOpen = false;

  $: hasSomeData = (): boolean => {
    if ($gestures.length === 0) {
      return false;
    }
    return $gestures.some(gesture => gesture.recordings.length > 0);
  };

  const onClearGestures = () => {
    if (confirm($t('content.data.controlbar.button.clearData.confirm'))) {
      clearGestures();
    }
  };

  const onDownloadGestures = () => {
    downloadDataset();
  };

  const onUploadGestures = () => {
    filePicker.click();
  };

  let filePicker: HTMLInputElement;
  onMount(() => {
    filePicker = document.createElement('input');
    filePicker.type = 'file';
    filePicker.accept = 'application/JSON';
    filePicker.onchange = () => {
      if (filePicker.files == null || filePicker.files.length < 1) {
        return;
      }
      const f = filePicker.files[0];
      loadDatasetFromFile(f);
      filePicker.value = ''; // To trick element to trigger onChange if same file selected
    };
    return () => {
      filePicker.remove();
    };
  });

  // Add a placeholder gesture
  $: if (!$gestures || $gestures.length === 0) {
    addGesture('');
  }
</script>

<main class="flex flex-col h-full inline-block w-full bg-backgrounddark">
  <TabView />
  <h1 class="sr-only">{$t('content.index.toolProcessCards.data.title')}</h1>

  <div class="flex justify-end px-10 mt-2">
    <DataPageMenu
      clearDisabled={$gestures.length === 0}
      downloadDisabled={$gestures.length === 0}
      {onClearGestures}
      {onDownloadGestures}
      {onUploadGestures} />
  </div>

  {#if !hasSomeData() && !$state.isInputConnected}
    <div class="h-full flex justify-center items-center">
      <PleaseConnectFirst />
    </div>
  {:else}
    <div class="flex flex-col flex-grow flex-shrink py-2 px-10 h-0 overflow-y-auto">
      <div class="grid grid-cols-[max-content,1fr] gap-x-7 gap-y-3">
        <Information
          isLightTheme={false}
          underlineIconText={false}
          iconText={$t('content.data.classification')}
          titleText={$t('content.data.classHelpHeader')}
          bodyText={$t('content.data.classHelpBody')} />
        <Information
          isVisible={$gestures.some(g => g.name)}
          isLightTheme={false}
          underlineIconText={false}
          iconText={$t('content.data.data')}
          titleText={$t('content.data.data')}
          bodyText={$t('content.data.dataDescription')} />

        {#each $gestures as gesture (gesture.ID)}
          <Gesture
            showWalkThrough={$gestures.length === 1}
            gesture={gestures.getGesture(gesture.ID)}
            onNoMicrobitSelect={() => (isConnectionDialogOpen = true)} />
        {/each}
      </div>

      <NewGestureButton />
      <div class="flex justify-end mt-auto">
        <TrainingButton onClick={() => navigate(Paths.TRAINING)} />
      </div>
    </div>
  {/if}
  <div class="h-160px w-full">
    <BottomPanel />
  </div>
</main>
