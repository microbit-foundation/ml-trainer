<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import Information from '../../../components/information/Information.svelte';
  import OutputGesture from '../../../components/output/OutputGesture.svelte';
  import { gestures } from '../../../script/stores/Stores';
  import { state } from '../../../script/stores/uiStore';
  import { t } from './../../../i18n';
  import downArrowImage from '../../../imgs/down_arrow.svg';
  import { bestPrediction } from '../../../script/stores/mlStore';
  import BottomPanel from '../../../components/bottom/BottomPanel.svelte';

  // Bool flags to know whether output microbit popup should be show
  let hasClosedPopup = false;

  let hasInteracted = false;

  // Bool flag to know whether to show the titles for the output gestures
  const enableOutputGestures = false;

  function onUserInteraction(): void {
    hasInteracted = true;
  }

  $: currentEstimatedGestureConfidence = $bestPrediction?.confidence.currentConfidence;
</script>

<h1 class="sr-only">{$t('content.index.toolProcessCards.model.title')}</h1>
<div class="flex flex-col h-full bg-backgrounddark">
  <div class="flex justify-center space-x-10 py-5 text-xl border-b-3 border-b-gray-200">
    <Information
      underlineIconText={false}
      isLightTheme={false}
      iconText={$t('content.model.output.estimatedGesture.iconTitle')}
      titleText={$t('content.model.output.estimatedGesture.descriptionTitle')}
      bodyText={$t('content.model.output.estimatedGesture.descriptionBody')} />
    <p class="font-semibold text-2xl">
      {$bestPrediction?.name ? $bestPrediction?.name : 'None'}
    </p>
    {#if currentEstimatedGestureConfidence}
      <p class="bg-secondary text-white rounded w-15 text-center">
        {Math.floor(currentEstimatedGestureConfidence * 100)}%
      </p>
    {/if}
  </div>
  <div class="flex-grow flex-shrink py-2 px-10 h-0 overflow-y-auto">
    <div
      class="grid {enableOutputGestures
        ? 'grid-cols-[max-content,max-content,max-content,max-content,max-content]'
        : 'grid-cols-[max-content,max-content]'} gap-x-7 gap-y-3">
      <Information
        underlineIconText={false}
        isLightTheme={false}
        iconText={$t('content.model.output.action.iconTitle')}
        titleText={$t('content.model.output.action.descriptionTitle')}
        bodyText={$t('content.model.output.action.descriptionBody')} />
      <Information
        underlineIconText={false}
        isLightTheme={false}
        iconText={$t('content.model.output.certainty.iconTitle')}
        titleText={$t('content.model.output.certainty.descriptionTitle')}
        bodyText={$t('content.model.output.certainty.descriptionBody')} />
      {#if enableOutputGestures}
        <Information
          isLightTheme={false}
          iconText={$t('content.model.output.ledOutput.descriptionTitle')}
          titleText={$t('content.model.output.ledOutput.descriptionTitle')}
          bodyText={$t('content.model.output.ledOutput.descriptionBody')} />
        <Information
          isLightTheme={false}
          iconText={$t('content.model.output.sound.iconTitle')}
          titleText={$t('content.model.output.sound.descriptionTitle')}
          bodyText={$t('content.model.output.sound.descriptionBody')} />
        <Information
          isLightTheme={false}
          iconText={$t('content.model.output.pin.iconTitle')}
          titleText={$t('content.model.output.pin.descriptionTitle')}
          bodyText={$t('content.model.output.pin.descriptionBody')} />
      {/if}

      <!-- Display all gestures and their output capabilities -->
      {#each gestures.getGestures() as gesture}
        <OutputGesture variant="stack" {gesture} {onUserInteraction} />
      {/each}
    </div>
    {#if !$state.isOutputConnected && !hasClosedPopup && hasInteracted}
      <div transition:fade class="grid grid-cols-5 absolute bottom-5 w-full min-w-729px">
        <div
          class="flex relative col-start-2 rounded-lg col-end-5 h-35"
          style="background-color:rgba(231, 229, 228, 0.85)">
          <div class="m-4 mr-2 w-3/4">
            <p class="text-2xl font-bold">
              {$t('content.model.output.popup.header')}
            </p>
            <p>
              {$t('content.model.output.popup.body')}
            </p>
          </div>
          <div class="text-center ml-0 mb-2 mt-8">
            <img
              class="m-auto arrow-filter-color"
              src={downArrowImage}
              alt="down arrow icon"
              width={80} />
          </div>
          <div class="absolute right-2 top-2">
            <button
              class="hover:bg-gray-100 rounded outline-transparent w-8"
              on:click={() => {
                hasClosedPopup = true;
              }}>
              <i
                class="fas fa-plus text-lg text-gray-600 hover:text-gray-800 duration-75"
                style="transform: rotate(45deg);" />
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
  <div class="h-160px w-full">
    <BottomPanel />
  </div>
</div>
