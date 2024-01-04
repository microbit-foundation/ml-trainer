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
  import IconButton from './IconButton.svelte';
  import RecordIcon from 'virtual:icons/fluent/record-20-regular';
  import CloseIcon from 'virtual:icons/ri/close-line';
  import StandardDialog from './dialogs/StandardDialog.svelte';

  export let onNoMicrobitSelect: () => void;
  export let gesture: Gesture;

  const defaultNewName = $t('content.data.classPlaceholderNewClass');
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

  // When title is clicked. Remove name
  function titleClicked(): void {
    if (gesture.getName() === defaultNewName) {
      gesture.setName('');
    }
  }

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

  // When microbit buttons are pressed, this is called
  // Assess whether settings match with button-clicked.
  // If so, the gesture calls the recording function.
  function triggerButtonsClicked(buttons: { buttonA: 0 | 1; buttonB: 0 | 1 }): void {
    const triggerButton = get(microbitInteraction);
    if ($chosenGesture !== gesture) {
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
</script>

<!-- Recording countdown popup -->
<StandardDialog isOpen={showCountdown || isThisRecording} onClose={cancelRecording}>
  <div class="flex flex-col gap-8 w-150">
    <h2 class="text-xl font-bold">
      {$t('content.data.recordingDialog.title', { values: { action: $nameBind } })}
    </h2>
    <div class="flex flex-col space-y-5 self-center items-center justify-center">
      <div class="flex justify-center">
        <p class="px-10 text-center w-70">
          {$t('content.data.recording.description')}
        </p>
      </div>
      <div class="flex items-center h-128px">
        {#if countdownValue > 0}
          <p class="text-9xl text-center text-brand-500">
            {countdownValue}
          </p>
        {:else}
          <p class="text-6xl text-center font-bold text-brand-500">
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
    <div class="flex justify-end">
      <StandardButton type="warning" onClick={cancelRecording}
        >{$t('content.data.recording.button.cancel')}</StandardButton>
    </div>
  </div>
</StandardDialog>

<!-- Title of gesture-->
<GestureTilePart small elevated>
  <div class="grid grid-cols-5 place-items-center p-2 w-50 h-30 relative">
    <div class="w-40 col-start-2 col-end-5 transition ease rounded bg-gray-100">
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
      <h3
        class="px-2"
        contenteditable
        bind:innerText={$nameBind}
        on:click={titleClicked}
        on:keypress={onTitleKeypress} />
    </div>
  </div>
</GestureTilePart>

<div class="max-w-max">
  <GestureTilePart small elevated>
    <div class="h-full flex items-center gap-x-3 p-2">
      <div class="w-33 flex justify-center items-center gap-x-3">
        <IconButton
          ariaLabel={$t(
            $chosenGesture === gesture
              ? 'content.data.recordAction'
              : 'content.data.selectAction',
            {
              values: {
                action: $nameBind,
              },
            },
          )}
          onClick={$chosenGesture === gesture ? countdownStart : selectClicked}
          disabled={!$state.isInputConnected}
          rounded>
          <RecordIcon
            class="h-20 w-20 {$chosenGesture === gesture
              ? 'text-rose-600'
              : 'text-neutral-400'} flex justify-center items-center rounded-full" />
        </IconButton>
      </div>
      {#if $gesture.recordings.length > 0}
        {#each $gesture.recordings as recording (String($gesture.ID) + String(recording.ID))}
          <Recording {recording} onDelete={deleteRecording} />
        {/each}
      {/if}
    </div>
  </GestureTilePart>
</div>
