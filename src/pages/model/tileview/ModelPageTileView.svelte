<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { get } from 'svelte/store';
  import TrainModelFirstTitle from '../../../components/TrainModelFirstTitle.svelte';
  import {
    areActionsAllowed,
    buttonPressed,
    state,
  } from '../../../script/stores/uiStore';
  import { settings } from '../../../script/stores/mlStore';
  import { classify } from '../../../script/ml';
  import { onMount } from 'svelte';
  import ModelPageTileViewTiles from './ModelPageTileViewTiles.svelte';
  import Microbits from '../../../script/microbit-interfacing/Microbits';

  // In case of manual classification, variables for evaluation
  let recordingTime = 0;
  // let lastRecording;

  // Bool flags to know whether output microbit popup should be show
  let hasInteracted = false;

  function onUserInteraction(): void {
    hasInteracted = true;
  }

  /**
   * Classify based on button click
   */
  // method for recording gesture for that specific gesture
  function classifyClicked() {
    if (!areActionsAllowed()) return;

    $state.isRecording = true;
    // lastRecording = undefined;

    // Get duration
    const duration = get(settings).duration;

    // Loading interval
    const loadingInterval = setInterval(() => {
      recordingTime++;
    }, duration / 30);

    // TODO: Clean this up to avoid 'firstMount' hack
    // Once duration is over (1000ms default), stop recording
    setTimeout(() => {
      clearInterval(loadingInterval);
      // lastRecording = getPrevData();
      $state.isRecording = false;
      recordingTime = 0;
      classify();
    }, duration);
  }

  // When microbit buttons are pressed, this is called
  // Assess whether settings match with button-clicked.
  // If so, the gesture calls the recording function.
  function triggerButtonsClicked(buttons: { buttonA: 0 | 1; buttonB: 0 | 1 }) {
    if (firstMount) {
      return;
    }

    let shouldClassify: boolean =
      !get(settings).automaticClassification &&
      (buttons.buttonA === 1 || buttons.buttonB === 1);

    if (shouldClassify) {
      classifyClicked();
    }
  }

  let firstMount = true;
  onMount(() => {
    firstMount = false;
    Microbits.getOutputMicrobit().resetPins();
  });

  $: triggerButtonsClicked($buttonPressed);
</script>

resetPins
<div class="h-full flex flex-col pt-4 pl-4">
  {#if !$state.isPredicting}
    <TrainModelFirstTitle />
  {:else}
    <ModelPageTileViewTiles />
    <div
      class="flex flex-row mt-12 mx-30 bg-backgroundlight border-secondary border-1 p-4 rounded justify-center shadow-xl">
      <div class="flex flex-col">
        <p class="text-md font-bold text-primary text-center">MakeCode</p>
        <p class="text-sm">
          You can create a hex file on <a
            target="_blank"
            href="https://makecode.microbit.org/S83658-20131-63602-68476"
            class="text-secondary">
            MakeCode
          </a>
        </p>
      </div>
    </div>
  {/if}
</div>
