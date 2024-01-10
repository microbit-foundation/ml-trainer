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
  } from '../script/stores/mlStore';
  import Recording from './Recording.svelte';
  import { t } from '../i18n';
  import StandardButton from './StandardButton.svelte';
  import GestureTilePart from './GestureTilePart.svelte';
  import StaticConfiguration from '../StaticConfiguration';
  import BaseDialog from './dialogs/BaseDialog.svelte';
  import Gesture from '../script/domain/Gesture';
  import { gestures } from '../script/stores/Stores';
  import greetingEmojiWithArrowImage from '../imgs/greeting-emoji-with-arrow.svg';
  import upCurveArrowImage from '../imgs/curve-arrow-up.svg';
  import IconButton from './IconButton.svelte';
  import RecordIcon from 'virtual:icons/fluent/record-20-regular';
  import CloseIcon from 'virtual:icons/ri/close-line';
  import StandardDialog from './dialogs/StandardDialog.svelte';

  export let onNoMicrobitSelect: () => void;
  export let gesture: Gesture;
  export let showWalkThrough: Boolean = false;

  const gesturePlaceholderName = $t('content.data.classPlaceholderNewClass');
  const recordingDuration = get(settings).duration;
  const countdownInitialValue = 3;

  let isThisRecording = false;
  let showCountdown = false;
  let countdownValue = countdownInitialValue;
  let countdownInterval: any;

  function cancelCountdown(): void {
    clearInterval(countdownInterval);
    showCountdown = false;
  }

  function cancelRecording(): void {
    cancelCountdown();
    isThisRecording = false;
  }

  function countdownStart(): void {
    countdownValue = countdownInitialValue;
    showCountdown = true;
    countdownInterval = setInterval(() => {
      countdownValue--;
      if (countdownValue === 0 && showCountdown) {
        recordData();
        showCountdown = false;
      } else if (!showCountdown) {
        cancelCountdown();
      }
    }, 1000);
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
      if (get(settings).numSamples <= newData.x.length) {
        if (isThisRecording) {
          const recording = { ID: Date.now(), data: newData } as RecordingData;
          addRecording(gesture.getId(), recording);
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

  // Selecting this gesture for recording. Updates settings accordingly
  // If gesture is already selected, the selection is removed.
  // If bluetooth is not connected, open connection prompt by calling callback
  function selectClicked(): void {
    if (!$state.isInputConnected) {
      chosenGesture.update(gesture => {
        gesture = null;
        return gesture;
      });
      onNoMicrobitSelect();
      return;
    }
    chosenGesture.update(chosen => {
      if (chosen === gesture) {
        chosen = null;
      } else {
        chosen = gesture;
      }
      return chosen;
    });
  }

  $: isChosenGesture = $chosenGesture === gesture;

  // When microbit buttons are pressed, this is called
  // Assess whether settings match with button-clicked.
  // If so, the gesture calls the recording function.
  function triggerButtonsClicked(buttons: { buttonA: 0 | 1; buttonB: 0 | 1 }): void {
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

  function onTitleKeypress(event: KeyboardEvent) {
    if (event.code === 'Enter') {
      event.preventDefault();
      if (event.target instanceof HTMLElement) {
        event.target.blur();
      }
      return true;
    }

    if ($nameBind.length >= StaticConfiguration.gestureNameMaxLength) {
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

  function selectGesture() {
    chosenGesture.update(chosen => {
      chosen = gesture;
      return chosen;
    });
  }

  // Select gesture when gesture is renamed
  $: if ($nameBind.trim()) {
    selectGesture();
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
</script>

<!-- Recording countdown popup -->
<StandardDialog isOpen={showCountdown || isThisRecording} onClose={cancelRecording}>
  <div class="flex flex-col items-center gap-8 w-120">
    <h2 class="text-xl font-bold self-start">
      {$t('content.data.recordingDialog.title', { values: { action: $nameBind } })}
    </h2>
    <div class="flex flex-col space-y-3 self-center items-center justify-center">
      <div class="flex justify-center">
        <p class="text-lg px-10 text-center">
          {$t('content.data.recording.description')}
        </p>
      </div>
      <div class="flex items-center h-100px">
        {#if countdownValue > 0}
          <p class="text-8xl text-center font-bold text-brand-500">
            {countdownValue}
          </p>
        {:else}
          <p class="text-5xl text-center font-bold text-brand-500">
            {$t('content.data.recordingDialog.recording')}
          </p>
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
  </div>
</StandardDialog>

<!-- Title of gesture-->
<GestureTilePart
  small
  elevated
  selected={isChosenGesture || showAddActionWalkThrough}
  on:click={selectGesture}>
  <div class="flex items-center justify-center p-2 w-50 h-30 relative">
    {#if !showAddActionWalkThrough}
      <div class="absolute right-2 top-2">
        <IconButton
          ariaLabel={$t('content.data.deleteAction', {
            values: {
              action: $nameBind,
            },
          })}
          onClick={removeClicked}>
          <CloseIcon class="text-xl m-1" />
        </IconButton>
      </div>
    {/if}
    <label for="gestureName" class="sr-only"
      >{$t('content.data.addAction.inputLabel')}</label>
    <input
      use:init
      name="gestureName"
      class="w-40 col-start-2 p-2 col-end-5 transition ease rounded bg-gray-100 placeholder-gray-500 outline-primary"
      id="gestureName"
      placeholder={gesturePlaceholderName}
      bind:value={$nameBind}
      on:keypress={onTitleKeypress} />
  </div>
</GestureTilePart>

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
  <div class="max-w-max {isGestureNamed || hasRecordings ? 'visible' : 'invisible'}">
    <GestureTilePart small elevated selected={isChosenGesture} on:click={selectGesture}>
      <div class="h-full flex items-center gap-x-3 p-2">
        <div class="w-33 flex justify-center items-center gap-x-3">
          <IconButton
            ariaLabel={$t(
              isChosenGesture ? 'content.data.recordAction' : 'content.data.selectAction',
              {
                values: {
                  action: $nameBind,
                },
              },
            )}
            onClick={isChosenGesture ? countdownStart : selectClicked}
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
            <Recording {recording} onDelete={deleteRecording} />
          {/each}
        {/if}
      </div>
    </GestureTilePart>
  </div>
{/if}

{#if isGestureNamed && showWalkThrough && !hasRecordings && !showCountdown && !isThisRecording}
  <!-- Empty div to fill first column of grid  -->
  <div></div>
  <div class="h-full flex" style="transform: translateX(65px)">
    <img class="w-15" alt="" src={upCurveArrowImage} />
    <p class="text-center w-50" style="transform: translateY(20px)">
      {$t('content.data.addRecordingWalkThrough')}
    </p>
  </div>
{/if}
