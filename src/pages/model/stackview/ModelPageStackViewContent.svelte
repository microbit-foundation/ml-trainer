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
  import GestureTilePart from '../../../components/GestureTilePart.svelte';

  // Bool flags to know whether output microbit popup should be show
  let hasClosedPopup = false;

  let hasInteracted = false;

  // Bool flag to know whether to show the titles for the output gestures
  const enableOutputGestures = false;

  function onUserInteraction(): void {
    hasInteracted = true;
  }

  $: prediction = $bestPrediction
    ? {
        name: $bestPrediction.name,
        certainty: `${Math.round($bestPrediction.confidence.currentConfidence * 100)}%`,
      }
    : {
        name: $t('content.model.output.estimatedGesture.none'),
      };
</script>

<h1 class="sr-only">{$t('content.index.toolProcessCards.model.title')}</h1>
<div class="flex flex-col h-full bg-backgrounddark">
  <GestureTilePart elevated class="flex mx-10 mt-5 mb-2 px-6 flex-row">
    <span class="sr-only" aria-live="polite">
      {$t('content.model.output.estimatedGesture.label', {
        values: {
          action: prediction.name,
        },
      })}
    </span>
    <div class="flex flex-grow justify-start gap-5 py-5 font-semibold text-2xl">
      <p class="text-infoicondark">
        {$t('content.model.output.estimatedGesture.iconTitle')}
      </p>
      <p>
        {prediction.name}
      </p>
    </div>
    <div class="flex flex-row justify-end m-auto gap-5">
      {#if prediction.certainty}
        <p class="text-xl bg-secondary text-white rounded w-15 text-center">
          {prediction.certainty}
        </p>
      {/if}
      <Information
        class="flex justify-center text-2xl"
        underlineIconText={false}
        isLightTheme={false}
        titleText={$t('content.model.output.estimatedGesture.descriptionTitle')}
        bodyText={$t('content.model.output.estimatedGesture.descriptionBody')} />
    </div>
  </GestureTilePart>
  <div class="flex flex-col flex-grow">
    <div
      class="grid {enableOutputGestures
        ? 'grid-cols-[240px,360px,177px,146px,1fr]'
        : 'grid-cols-[240px,max-content]'} gap-x-7 items-center flex-shrink-0 h-13 px-10 z-3 border-b-3 border-gray-200 sticky top-0 bg-backgrounddark">
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
    </div>
    <div
      class="grid {enableOutputGestures
        ? 'grid-cols-[210px,360px,177px,146px,max-content]'
        : 'grid-cols-[210px,max-content]'} auto-rows-max gap-x-7 gap-y-3 py-2 px-10 flex-grow flex-shrink h-0 overflow-y-auto">
      <!-- Display all gestures and their output capabilities -->
      {#each gestures.getGestures() as gesture}
        <section class="contents">
          <OutputGesture variant="stack" {gesture} {onUserInteraction} />
        </section>
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
              alt={$t('arrowIconDown.altText')}
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
