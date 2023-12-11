<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { hasSufficientData, state } from '../../script/stores/uiStore';
  import { TrainingStatus, gestures, trainingStatus } from '../../script/stores/mlStore';
  import { t } from '../../i18n';
  import StandardDialog from '../../components/dialogs/StandardDialog.svelte';
  import { slide } from 'svelte/transition';
  import TrainingButton from './TrainingButton.svelte';
  import TabView from '../../views/TabView.svelte';

  $: sufficientData = hasSufficientData($gestures);

  let isFailedTrainingDialogOpen = false;

  $: {
    if ($trainingStatus === TrainingStatus.Failure) {
      isFailedTrainingDialogOpen = true;
      trainingStatus.update(() => TrainingStatus.Untrained);
    }
  }
</script>

<StandardDialog
  isOpen={isFailedTrainingDialogOpen}
  onClose={() => (isFailedTrainingDialogOpen = false)}>
  <div
    class="justify-center items-center content-center w-150 bg-white m-auto"
    transition:slide>
    <div>
      <p class="text-warning font-bold text-center text-xl mb-5">
        {$t('content.trainer.failure.header')}
      </p>
      <p class="mb-3">
        {$t('content.trainer.failure.body')}
      </p>
      <p class="font-bold">
        {$t('content.trainer.failure.todo')}
      </p>
    </div>
  </div>
</StandardDialog>

<div class="flex flex-col h-full pb-10">
  <TabView />
  <div class="flex flex-col flex-grow justify-center items-center text-center">
    {#if !sufficientData}
      <div class="w-full text-primarytext">
        <h1 class="w-3/4 text-3xl bold m-auto">
          {$t('menu.trainer.notEnoughDataHeader1')}
        </h1>
        <p class="w-3/5 text-xl m-auto mt-5">
          {$t('menu.trainer.notEnoughDataInfoBody')}
        </p>
      </div>
    {:else if $state.isTraining}
      <div class="w-3/4 text-primarytext">
        <div class="ml-auto mr-auto flex center-items justify-center">
          <i
            class="fa fa-solid fa-circle-notch text-5xl animate-spin animate-duration-[2s]" />
        </div>
        <p class="bold text-3xl bold mt-10">
          {$t('menu.trainer.isTrainingModelButton')}
        </p>
      </div>
    {:else}
      <div class="w-3/4 text-primarytext">
        {#if $state.isPredicting}
          <p class="bold text-3xl bold mt-10">
            {$t('menu.trainer.TrainingFinished')}
          </p>
          <p class="bold text-xl bold mt-10">
            {$t('menu.trainer.TrainingFinished.body')}
          </p>
        {/if}
      </div>
    {/if}
  </div>

  <TrainingButton />
</div>
