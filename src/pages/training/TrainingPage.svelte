<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { hasSufficientData, state } from '../../script/stores/uiStore';
  import { TrainingStatus, trainingStatus } from '../../script/stores/mlStore';
  import { t } from '../../i18n';
  import StandardDialog from '../../components/dialogs/StandardDialog.svelte';
  import { slide } from 'svelte/transition';
  import TrainingButton from './TrainingButton.svelte';
  import TabView from '../../views/TabView.svelte';
  import trainModelImage from '../../imgs/TrainModel.svg';
  import loadingSpinnerImage from '../../imgs/loadingspinner.gif';
  import StandardButton from '../../components/StandardButton.svelte';
  import { Paths, navigate } from '../../router/paths';
  import { trainModel } from '../../script/ml';

  let descriptionTextColour = '#8892A3';

  function navigateModelPage(): void {
    navigate(Paths.MODEL);
  }

  function navigateDataPage(): void {
    navigate(Paths.DATA);
  }
  $: sufficientData = hasSufficientData();

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

<div class="flex flex-col pb-5 bg-backgrounddark">
  <TabView />
  <img class="self-center pt-10" src={trainModelImage} alt="train model" width="350" />
  <p class="text-2xl font-semibold self-center pb-5">{$t('content.trainer.header')}</p>
  <p class="text-center self-center leading-relaxed text-[{descriptionTextColour}] w-180">
    {$t('content.trainer.description')}
  </p>
  <div class="flex flex-col flex-grow justify-center items-center text-center">
    {#if !sufficientData}
      <div class="w-full py-10">
        <h1 class="text-xl bold m-auto font-semibold">
          {$t('menu.trainer.notEnoughDataHeader1')}
        </h1>
        <p class="pt-5 pb-10 text-[{descriptionTextColour}]">
          {$t('menu.trainer.notEnoughDataInfoBody')}
        </p>
        <StandardButton onClick={navigateDataPage} type="primary"
          >{$t('menu.trainer.addDataButton')}</StandardButton>
      </div>
    {:else if sufficientData && !$state.isTraining && !$state.isPredicting}
      <p class="font-semibold text-2xl py-10">{$t('content.trainer.enoughdata.title')}</p>
      <div class="pt-10">
        <TrainingButton onClick={trainModel} />
      </div>
    {:else if $state.isTraining}
      <div class="text-primarytext">
        <div class="ml-auto mr-auto flex flex-col center-items justify-center">
          <p class="text-2xl font-semibold pt-10">
            {$t('content.trainer.training.title')}
          </p>
          <img
            alt="loading"
            src={loadingSpinnerImage}
            width="100px"
            class="self-center" />
        </div>
      </div>
    {:else if $state.isPredicting}
      <p class="text-2xl font-semibold mt-10 pb-10">
        {$t('menu.trainer.TrainingFinished')}
      </p>
      <div class="flex flexbox space-x-10">
        <StandardButton onClick={navigateDataPage} type="secondary"
          >{$t('menu.trainer.addMoreDataButton')}</StandardButton>
        <StandardButton onClick={navigateModelPage} type="primary"
          >{$t('menu.trainer.testModelButton')}</StandardButton>
      </div>
    {/if}
  </div>
</div>
