<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { buttonPressed, areActionsAllowed, state } from '../../script/stores/uiStore';
  import { gestures, settings } from '../../script/stores/mlStore';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
  import { classify } from '../../script/ml';
  import { t } from '../../i18n';
  import Information from '../../components/information/Information.svelte';
  import Microbits from '../../script/microbit-interfacing/Microbits';
  import TrainModelFirstTitle from '../../components/TrainModelFirstTitle.svelte';
  import OutputGesture from '../../components/output/OutputGesture.svelte';

  // In case of manual classification, variables for evaluation
  let recordingTime = 0;

  /**
   * Classify based on button click
   */
  // method for recording gesture for that specific gesture
  function classifyClicked() {
    if (!areActionsAllowed()) return;

    $state.isRecording = true;

    const duration = get(settings).duration;

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

<main class="h-full flex flex-col pt-4 pl-4">
  {#if $state.isPredicting}
    <div>
      <div class="relative left-5 h-8">
        <Information
          isLightTheme={false}
          iconText={$t('content.model.output.prediction.iconTitle')}
          titleText={$t('content.model.output.prediction.descriptionTitle')}
          bodyText={$t('content.model.output.prediction.descriptionBody')} />
      </div>

      <div class="pl-1">
        {#each $gestures as gesture}
          <OutputGesture variant="stack" {gesture} />
        {/each}
      </div>
    </div>
  {:else}
    <TrainModelFirstTitle />
  {/if}
</main>
