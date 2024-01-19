<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import {
    buttonPressed,
    areActionsAllowed,
    state,
  } from '../../../script/stores/uiStore';
  import { settings } from '../../../script/stores/mlStore';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
  import { classify } from '../../../script/ml';
  import Microbits from '../../../script/microbit-interfacing/Microbits';
  import TrainModelFirstTitle from '../../../components/TrainModelFirstTitle.svelte';
  import ModelPageStackViewContent from './ModelPageStackViewContent.svelte';
  import TabView from '../../../views/TabView.svelte';

  // In case of manual classification, variables for evaluation
  let recordingTime = 0;
  // let lastRecording;

  // Bool flags to know whether output microbit popup should be show
  let hasInteracted = false;

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
    Microbits.resetIOPins();
  });

  $: triggerButtonsClicked($buttonPressed);
</script>

<!-- Main pane -->
<div class="h-full flex flex-col">
  <TabView />
  <main class="contents">
    {#if $state.isPredicting}
      <ModelPageStackViewContent />
    {:else}
      <TrainModelFirstTitle />
    {/if}
  </main>
</div>
