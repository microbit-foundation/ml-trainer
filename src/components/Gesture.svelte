<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<style>
  @keyframes loading-bar {
    0% {
      width: 0%;
    }
    100% {
      width: 100%;
    }
  }

  .animate-loading-bar {
    animation: loading-bar 1.8s linear;
  }
</style>

<script lang="ts">
  import { get } from 'svelte/store';
  import {
    alertUser,
    buttonPressed,
    areActionsAllowed,
    state,
    microbitInteraction,
    MicrobitInteractions,
  } from '../script/stores/uiStore';
  import {
    addRecording,
    chosenGesture,
    livedata,
    type RecordingData,
    removeRecording,
    settings,
    updateGestureMatrix,
  } from '../script/stores/mlStore';
  import Recording from './Recording.svelte';
  import { t } from '../i18n';
  import StandardButton from './StandardButton.svelte';
  import GestureTilePart from './GestureTilePart.svelte';
  import StaticConfiguration from '../StaticConfiguration';
  import Gesture from '../script/domain/Gesture';
  import { gestures } from '../script/stores/Stores';
  import greetingEmojiWithArrowImage from '../imgs/greeting-emoji-with-arrow.svg';
  import upCurveArrowImage from '../imgs/curve-arrow-up.svg';
  import IconButton from './IconButton.svelte';
  import RecordIcon from 'virtual:icons/fluent/record-20-regular';
  import CloseIcon from 'virtual:icons/ri/close-line';
  import ArrowDownIcon from 'virtual:icons/ri/arrow-down-s-fill';
  import EditIcon from 'virtual:icons/ri/edit-2-line';
  import StandardDialog from './dialogs/StandardDialog.svelte';
  import { logEvent, logMessage } from '../script/utils/logging';
  import LedMatrix from './output/LedMatrix.svelte';
  import { createPopover } from '@melt-ui/svelte';
  import { matrixImages } from '../script/utils/matrixImages';
  import SimpleLedMatrix from './output/SimpleLedMatrix.svelte';

  export let gesture: Gesture;
  export let showWalkThrough: Boolean = false;

  const gesturePlaceholderName = $t('content.data.classPlaceholderNewClass');
  const recordingDuration = get(settings).duration;
  interface CountdownConfig {
    value: string | number;
    duration: number;
    ledPattern: boolean[];
  }

  const T = true;
  const F = false;
  const countdownConfigs: CountdownConfig[] = [
    {
      value: 3,
      duration: 500,
      ledPattern: [
        [T, T, T, T, F],
        [F, F, F, T, F],
        [F, F, T, F, F],
        [T, F, F, T, F],
        [F, T, T, F, F],
      ].flat(),
    },
    {
      value: 2,
      duration: 500,
      ledPattern: [
        [T, T, T, F, F],
        [F, F, F, T, F],
        [F, T, T, F, F],
        [T, F, F, F, F],
        [T, T, T, T, F],
      ].flat(),
    },
    {
      value: 1,
      duration: 500,
      ledPattern: [
        [F, F, T, F, F],
        [F, T, T, F, F],
        [F, F, T, F, F],
        [F, F, T, F, F],
        [F, T, T, T, F],
      ].flat(),
    },
    {
      value: $t('content.data.recordingDialog.go'),
      duration: 1000,
      ledPattern: [
        [T, T, T, T, T],
        [T, F, F, F, T],
        [T, F, F, F, T],
        [T, F, F, F, T],
        [T, T, T, T, T],
      ].flat(),
    },
  ];

  const recordingLedPattern = [
    [F, F, F, F, F],
    [F, T, T, T, F],
    [F, T, T, T, F],
    [F, T, T, T, F],
    [F, F, F, F, F],
  ].flat();

  let isThisRecording = false;
  let showCountdown = false;
  let countdownIdx = 0;

  function cancelRecording(): void {
    showCountdown = false;
    isThisRecording = false;
  }

  function countdownStart(): void {
    selectGesture();

    countdownIdx = 0;
    showCountdown = true;

    function countdown(config: CountdownConfig): void {
      setTimeout(() => {
        countdownIdx++;
        if (!showCountdown) {
          // recording cancelled
          return;
        }
        if (countdownIdx < countdownConfigs.length) {
          countdown(countdownConfigs[countdownIdx]);
        } else {
          recordData();
          showCountdown = false;
        }
      }, config.duration);
    }

    countdown(countdownConfigs[countdownIdx]);
  }

  const nameBind = gesture.bindName();

  $: hasRecordings = $gesture.recordings.length > 0;
  $: isGestureNamed = $nameBind.trim().length > 0;
  $: showAddActionWalkThrough = !isGestureNamed && showWalkThrough && !hasRecordings;

  function removeClicked(): void {
    if (!areActionsAllowed(false)) {
      return;
    }

    if (
      !window.confirm($t('alert.deleteGestureConfirm', { values: { action: $nameBind } }))
    ) {
      return;
    }
    $state.isPredicting = false;

    setTimeout(() => {
      gestures.removeGesture(gesture.getId());
    }, 450);
  }

  // method for recording data point for that specific gesture
  async function recordData(): Promise<void> {
    if (!areActionsAllowed()) {
      return;
    }

    $state.isRecording = true;
    isThisRecording = true;

    // New array for data
    let newData: { x: number[]; y: number[]; z: number[] } = { x: [], y: [], z: [] };

    // Set timeout to allow recording in 1s
    const unsubscribe = livedata.subscribe(data => {
      newData.x.push(data.accelX);
      newData.y.push(data.accelY);
      newData.z.push(data.accelZ);
    });

    // Once duration is over (1000ms default), stop recording
    setTimeout(() => {
      unsubscribe();
      logMessage('RECEIVED SAMPLES', get(settings).numSamples, newData.x.length);
      if (get(settings).numSamples <= newData.x.length) {
        if (isThisRecording) {
          const recording = { ID: Date.now(), data: newData } as RecordingData;
          addRecording(gesture.getId(), recording);
          logEvent({ type: 'Data', action: 'Add recording' });
        }
      } else {
        alertUser($t('alert.recording.disconnectedDuringRecording'));
      }
      $state.isRecording = false;
      isThisRecording = false;
    }, recordingDuration);
  }

  // Delete recording from recordings array
  function deleteRecording(recording: RecordingData) {
    if (!areActionsAllowed(false)) {
      return;
    }
    $state.isPredicting = false;
    removeRecording(gesture.getId(), recording.ID);
  }

  function selectGesture(): void {
    $chosenGesture = gesture;
  }

  $: isChosenGesture = $chosenGesture === gesture;

  // When microbit buttons are pressed, this is called
  // Assess whether settings match with button-clicked.
  // If so, the gesture calls the recording function.
  function triggerButtonsClicked(buttons: { buttonA: 0 | 1; buttonB: 0 | 1 }): void {
    if (showCountdown || isThisRecording) {
      return;
    }
    const triggerButton = get(microbitInteraction);
    if (!isChosenGesture) {
      return;
    }
    if (
      triggerButton === MicrobitInteractions.AB ||
      (buttons.buttonA && triggerButton === MicrobitInteractions.A) ||
      (buttons.buttonB && triggerButton === MicrobitInteractions.B)
    )
      countdownStart();
  }

  function handleActionNameKeypress(event: KeyboardEvent) {
    if (event.code === 'Enter') {
      return;
    }

    if (editableName.length >= StaticConfiguration.gestureNameMaxLength) {
      event.preventDefault();
      alertUser(
        $t('alert.data.classNameLengthAlert', {
          values: {
            maxLen: StaticConfiguration.gestureNameMaxLength,
          },
        }),
      );
      return false;
    }
  }

  function handleActionNamePaste(event: ClipboardEvent) {
    const value = event.clipboardData?.getData('text');
    const maxLength = StaticConfiguration.gestureNameMaxLength;
    if (value && value.length + editableName.length > maxLength) {
      event.preventDefault();
      const caret = (event.target as HTMLInputElement).selectionStart ?? 0;
      const untrimmedValue =
        editableName.substring(0, caret) + value + editableName.substring(caret);
      editableName = untrimmedValue.substring(0, maxLength);
      alertUser(
        $t('alert.data.classNameLengthAlert', {
          values: {
            maxLen: maxLength,
          },
        }),
      );
    }
  }

  // Make function depend on buttonsPressed store.
  let declaring = true;
  $: {
    if (!declaring) {
      // Do not call when component is mounted
      triggerButtonsClicked($buttonPressed);
    } else {
      declaring = false;
    }
  }

  // Focus on input element when gesture is just added
  function init(el: HTMLElement) {
    el.focus();
    selectGesture();
  }

  $: editableName = $nameBind ?? gesturePlaceholderName;
  let isActionNameDialogOpen = false;

  function onActionNameDialogOpen() {
    editableName = $nameBind ?? gesturePlaceholderName;
    isActionNameDialogOpen = true;
  }
  function onActionNameDialogClose() {
    isActionNameDialogOpen = false;
  }
  function onActionNameEditSave() {
    $nameBind = editableName;
    onActionNameDialogClose();
  }
  function onActionSubmit(event: SubmitEvent) {
    event.preventDefault();
    onActionNameEditSave();
  }

  const {
    elements: { trigger, content, arrow },
    states,
  } = createPopover({
    preventScroll: true,
  });

  function handleImageSelection(gestureId: number, image: boolean[]) {
    updateGestureMatrix(gestureId, image);
    states.open.set(false);
  }
</script>

<!-- Edit action name dialog -->
<StandardDialog
  isOpen={isActionNameDialogOpen}
  onClose={onActionNameDialogClose}
  class="w-100 space-y-5">
  <svelte:fragment slot="heading">Edit action name</svelte:fragment>
  <svelte:fragment slot="body">
    <form on:submit={onActionSubmit}>
      <label for="gestureName" class="sr-only"
        >{$t('content.data.addAction.inputLabel')}</label>
      <input
        use:init
        name="gestureName"
        class="w-full col-start-2 p-2 col-end-5 transition ease rounded bg-gray-100 placeholder-gray-500 outline-none focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:ring-ring"
        id="gestureName"
        placeholder={gesturePlaceholderName}
        bind:value={editableName}
        on:keypress={handleActionNameKeypress}
        on:paste={handleActionNamePaste} />
    </form>

    <div class="flex gap-x-3 justify-end">
      <StandardButton size="normal" onClick={onActionNameDialogClose}
        >Cancel</StandardButton>
      <StandardButton size="normal" type="primary" onClick={onActionNameEditSave}
        >Confirm</StandardButton>
    </div>
  </svelte:fragment>
</StandardDialog>

<!-- Recording countdown popup -->
<StandardDialog
  isOpen={showCountdown || isThisRecording}
  onClose={cancelRecording}
  class="flex flex-col gap-8 w-120">
  <svelte:fragment slot="heading">
    {$t('content.data.recordingDialog.title', { values: { action: $nameBind } })}
  </svelte:fragment>
  <svelte:fragment slot="body">
    <div class="flex flex-col space-y-3 self-center items-center justify-center">
      <div class="flex items-center h-100px">
        {#if countdownIdx < countdownConfigs.length}
          <SimpleLedMatrix
            matrix={countdownConfigs[countdownIdx].ledPattern}
            ariaLabel={`${countdownConfigs[countdownIdx].value}`} />
        {:else}
          <SimpleLedMatrix
            matrix={recordingLedPattern}
            ariaLabel={$t('content.data.recordingDialog.recording')} />
        {/if}
      </div>
      <!-- Recording bar to show recording progress -->
      <div class="w-70 h-6 bg-red-200 rounded-full overflow-hidden">
        <div
          class="h-full bg-red-600 w-0 {isThisRecording ? 'animate-loading-bar' : ''}" />
      </div>
    </div>
    <StandardButton type="warning" onClick={cancelRecording}
      >{$t('content.data.recording.button.cancel')}</StandardButton>
  </svelte:fragment>
</StandardDialog>

<!-- Title of gesture-->
<!-- svelte-ignore a11y-no-static-element-interactions 
     You can instead interact with the button. A better model of row selection would be a good enhancement. -->
<div on:click={selectGesture}>
  <GestureTilePart small elevated selected={isChosenGesture || showAddActionWalkThrough}>
    <div
      class="flex items-center justify-center w-full h-full p-2 relative flex-col gap-1">
      {#if !showAddActionWalkThrough}
        <div class="absolute right-2 top-2">
          <IconButton
            ariaLabel={$t('content.data.deleteAction', {
              values: {
                action: $nameBind,
              },
            })}
            onClick={removeClicked}
            on:focus={selectGesture}>
            <CloseIcon class="text-xl m-1" />
          </IconButton>
        </div>
      {/if}
      <div class="flex items-end gap-2">
        <LedMatrix mode="input" gesture={$gesture} />
        <IconButton ariaLabel="Change image" {...$trigger} useAction={trigger}>
          <ArrowDownIcon class="text-xl m-1" />
        </IconButton>
      </div>
      {#if states.open}
        <div class="bg-white shadow-md rounded-xl p-5 z-10" {...$content} use:content>
          <div {...$arrow} use:arrow />
          <div class="grid grid-cols-5 gap-5 h-100 overflow-y-auto">
            {#each Object.values(matrixImages) as image}
              <IconButton
                ariaLabel="Select image"
                onClick={() => handleImageSelection($gesture.ID, image)}>
                <SimpleLedMatrix matrix={image} />
              </IconButton>
            {/each}
          </div>
        </div>
      {/if}
      <div class="flex gap-x-3 px-3 pr-0 w-full items-center justify-between">
        <h3 class="w-full truncate">{$nameBind}</h3>
        <IconButton ariaLabel="Edit action name" onClick={onActionNameDialogOpen}>
          <EditIcon class="text-xl m-1" />
        </IconButton>
      </div>
    </div>
  </GestureTilePart>
</div>

{#if showAddActionWalkThrough}
  <div
    class="h-full flex w-50 flex-col relative items-center"
    style="transform: translate(-50px, 50px)">
    <img class="mb-3 w-30" alt="" src={greetingEmojiWithArrowImage} />
    <p class="text-center">
      {$t('content.data.addActionWalkThrough')}
    </p>
  </div>
{:else}
  <!-- svelte-ignore a11y-no-static-element-interactions 
        See above -->
  <div
    class="max-w-max {isGestureNamed || hasRecordings ? 'visible' : 'invisible'}"
    on:click={selectGesture}>
    <GestureTilePart small elevated selected={isChosenGesture} on:focus={selectGesture}>
      <div class="h-full flex items-center gap-x-3 p-2">
        <div class="w-33 flex justify-center items-center gap-x-3">
          <IconButton
            ariaLabel={$t(
              isChosenGesture
                ? 'content.data.recordAction'
                : 'content.data.selectAndRecordAction',
              {
                values: {
                  action: $nameBind,
                },
              },
            )}
            onClick={countdownStart}
            disabled={!$state.isInputConnected}
            rounded>
            <RecordIcon
              class="h-20 w-20 {isChosenGesture
                ? 'text-red-600'
                : 'text-neutral-400'} flex justify-center items-center rounded-full" />
          </IconButton>
        </div>
        {#if hasRecordings}
          {#each $gesture.recordings as recording (String($gesture.ID) + String(recording.ID))}
            <Recording {recording} onDelete={deleteRecording} on:focus={selectGesture} />
          {/each}
        {/if}
      </div>
    </GestureTilePart>
  </div>
{/if}

{#if isGestureNamed && showWalkThrough && !hasRecordings && !showCountdown && !isThisRecording}
  <!-- Empty div to fill first column of grid  -->
  <div></div>
  <div class="relative">
    <div class="flex absolute" style="transform: translateX(65px)">
      <img class="w-15" alt="" src={upCurveArrowImage} />
      <p class="text-center w-50" style="transform: translateY(20px)">
        {$t('content.data.addRecordingWalkThrough')}
      </p>
    </div>
  </div>
{/if}
