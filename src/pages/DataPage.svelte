<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<style>
  .toggle-button {
    --w: 2.75rem;
    --padding: 0.125rem;
    width: var(--w);
  }

  .thumb {
    --size: 1.25rem;
    width: var(--size);
    height: var(--size);
    transform: translateX(var(--padding));
  }

  :global([data-state='checked']) .thumb {
    transform: translateX(calc(var(--w) - var(--size) - var(--padding)));
  }
</style>

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
  import { Paths, getTitle, navigate } from '../router/paths';
  import { createSwitch } from '@melt-ui/svelte';

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

  let trainingButtonPrimary = false;
  $: {
    if ($gestures.filter(g => g.recordings.length >= 3).length >= 2) {
      trainingButtonPrimary = true;
    }
  }

  $: title = getTitle(Paths.DATA, $t);

  const {
    elements: { root, input },
    states: { checked },
  } = createSwitch();
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<div class="flex flex-col h-full inline-block w-full bg-backgrounddark">
  <TabView />
  <main class="contents">
    <h1 class="sr-only">{$t('content.index.toolProcessCards.data.title')}</h1>

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
              <Gesture
                showFingerprint={$checked}
                showWalkThrough={$gestures.length === 1}
                gesture={gestures.getGesture(gesture.ID)} />
            </section>
          {/each}
        </div>
      </div>
    {/if}
    <div
      class="flex items-center justify-between px-10 py-2 border-b-3 border-t-3 border-gray-200">
      <NewGestureButton
        type={!trainingButtonPrimary ? 'primary' : 'secondary'}
        disabled={!$gestures.every(g => g.name.trim())} />
      <div class="flex items-center gap-x-2">
        <div class="flex items-center gap-x-5">
          <div class="flex items-center">
            <label class="pr-4" for="show-fingerprint" id="show-fingerprint-label">
              Show fingerprint
            </label>
            <button
              {...$root}
              use:root
              class="toggle-button relative h-6 cursor-pointer rounded-full transition-colors"
              class:bg-brand-500={$checked}
              class:bg-gray-500={!$checked}
              id="show-fingerprint"
              aria-labelledby="show-fingerprint-label">
              <span class="thumb block rounded-full bg-white transition" />
            </button>
            <input {...$input} use:input />
          </div>
          <TrainingButton
            type={trainingButtonPrimary ? 'primary' : 'secondary'}
            onClick={() => navigate(Paths.TRAINING)} />
        </div>
        <DataPageMenu
          clearDisabled={$gestures.length === 0}
          downloadDisabled={$gestures.length === 0}
          {onClearGestures}
          {onDownloadGestures}
          {onUploadGestures} />
      </div>
    </div>
    <div class="h-160px w-full">
      <BottomPanel showFingerprint={$checked} />
    </div>
  </main>
</div>
