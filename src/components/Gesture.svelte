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

  .record-button.disabled i {
    color: lightgray;
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
    isThisRecording = false;
    countdownValue = countdownInitialValue;
  }

  function countdownStart(): void {
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
      !window.confirm($t('alert.deleteGestureConfirm') + '"' + gesture.getName() + '"?')
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
      $state.isRecording = false;
      isThisRecording = false;
      unsubscribe();
      if (get(settings).numSamples <= newData.x.length) {
        const recording = { ID: Date.now(), data: newData } as RecordingData;
        addRecording(gesture.getId(), recording);
      } else {
        alertUser($t('alert.recording.disconnectedDuringRecording'));
      }
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
<BaseDialog
  background="light"
  isOpen={showCountdown || isThisRecording}
  onClose={cancelCountdown}>
  <div class="flex flex-col space-y-10">
    <div class="space-y-10 w-70">
      {#if showCountdown}
        <GestureTilePart elevated={true}>
          <p class="text-9xl text-center text-gray-400">{countdownValue}</p>
          <p class="pt-5 px-10 text-gray-400 text-center">
            {$t('content.data.recording.description')}
          </p>
        </GestureTilePart>
      {/if}
      <StandardButton type="warning" onClick={() => cancelCountdown}
        >{$t('content.data.recording.button.cancel')}</StandardButton>
    </div>
    {#if isThisRecording}
      <!-- Recording bar to show recording progress -->
      <div class="w-70 h-6 bg-red-200 rounded-full overflow-hidden">
        <div class="h-full bg-red-600 animate-loading-bar" />
      </div>
    {/if}
  </div>
</BaseDialog>

<!-- Title of gesture-->
<GestureTilePart small elevated>
  <div class="grid grid-cols-5 place-items-center p-2 w-50 h-30">
    <div class="w-40 col-start-2 col-end-5 transition ease rounded bg-gray-100">
      <h3
        class="px-2"
        contenteditable
        bind:innerText={$nameBind}
        on:click={titleClicked}
        on:keypress={onTitleKeypress} />
    </div>
    <button
      class="pl-3 col-start-5 place-self-start justify-self-end outline-none"
      on:click={removeClicked}>
      <i class="far fa-times-circle fa-lg text-gray-500" />
    </button>
  </div>
</GestureTilePart>

<div class="flex rounded-lg bg-backgroundlight shadow-md max-w-max">
  <GestureTilePart small mr>
    <div
      class="h-full w-35 flex justify-center"
      class:cursor-pointer={$state.isInputConnected}
      on:click={$chosenGesture === gesture ? countdownStart : selectClicked}>
      <button
        class="record-button"
        class:disabled={$chosenGesture !== gesture}
        class:cursor-default={!$state.isInputConnected}>
        <i class="fas fa-circle text-rose-600 text-4xl" />
      </button>
    </div>
  </GestureTilePart>

  {#if $gesture.recordings.length > 0}
    <GestureTilePart small>
      <div class="flex p-2 h-30">
        {#each $gesture.recordings as recording (String($gesture.ID) + String(recording.ID))}
          <Recording {recording} onDelete={deleteRecording} />
        {/each}
      </div>
    </GestureTilePart>
  {/if}
</div>
