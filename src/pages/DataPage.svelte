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
  import { Paths, getTitle, navigate } from '../router/paths';
  import StandardDialog from '../components/dialogs/StandardDialog.svelte';
  import StandardButton from '../components/StandardButton.svelte';
  import Microbits from '../script/microbit-interfacing/Microbits';

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

  let collectDataInFieldDialogIsOpen = false;
  const onCollectDataInField = () => {
    collectDataInFieldDialogIsOpen = true;
  };
  const onCloseCollectDataInFieldDialog = () => {
    collectDataInFieldDialogIsOpen = false;
  };

  const onSwitchToFieldMode = () => {
    if (Microbits.getInputMicrobit() === undefined) {
      console.log('No input micro:bit?!');
    }
    Microbits.getInputMicrobit()?.sendToInputUart(
      'd',
      'still,0000000000111110000000000;shake,0000010101010100000000000;\n',
    );
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
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<!-- Recording countdown popup -->
<StandardDialog
  isOpen={collectDataInFieldDialogIsOpen}
  onClose={onCloseCollectDataInFieldDialog}
  class="flex flex-col gap-8 w-120">
  <svelte:fragment slot="heading">Collect data in the field</svelte:fragment>
  <svelte:fragment slot="body">
    <div class="flex flex-col space-y-3 self-center items-center justify-center">
      <div class="flex items-center h-100px">
        Button A and B to switch action. Button A+B to start collecting data. Logo to
        switch back to bluetooth mode. Reset button to switch back to logging mode.
      </div>
    </div>
    <div class="flex flex-row space-x-3 self-center items-center justify-center">
      <StandardButton type="primary" onClick={onSwitchToFieldMode}
        >Switch to field mode</StandardButton>
      <StandardButton type="secondary" onClick={onCloseCollectDataInFieldDialog}
        >Cancel</StandardButton>
    </div>
  </svelte:fragment>
</StandardDialog>

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
          class="grid grid-cols-[292px,1fr] gap-x-7 items-center flex-shrink-0 h-13 px-10 z-3 border-b-3 border-gray-200 sticky top-0 bg-backgrounddark">
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
          class="grid grid-cols-[292px,1fr] auto-rows-max gap-x-7 gap-y-3 py-2 px-10 flex-grow flex-shrink h-0 overflow-y-auto">
          {#each $gestures as gesture (gesture.ID)}
            <section class="contents">
              <Gesture
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
        <TrainingButton
          type={trainingButtonPrimary ? 'primary' : 'secondary'}
          onClick={() => navigate(Paths.TRAINING)} />
        <DataPageMenu
          clearDisabled={$gestures.length === 0}
          downloadDisabled={$gestures.length === 0}
          {onClearGestures}
          {onDownloadGestures}
          {onUploadGestures}
          {onCollectDataInField} />
      </div>
    </div>
    <div class="h-160px w-full">
      <BottomPanel />
    </div>
  </main>
</div>
