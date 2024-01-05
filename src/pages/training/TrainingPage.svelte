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
  import TrainingStatusSection from '../../components/TrainingStatusSection.svelte';

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

<div class="flex flex-col items-center pb-5 bg-backgrounddark">
  <TabView />
  <img
    class="pt-10 opacity-40"
    src={trainModelImage}
    alt={$t('content.trainer.imageAlt')}
    width="350" />
  <h1 class="text-2xl font-bold pb-3">{$t('content.trainer.header')}</h1>
  <p class="text-center leading-relaxed w-150">
    {$t('content.trainer.description')}
  </p>
  <div class="flex flex-col flex-grow justify-center items-center text-center">
    {#if !sufficientData}
      <TrainingStatusSection
        statusId="content.trainer.notEnoughData.title"
        descriptionId="content.trainer.notEnoughData.body">
        <StandardButton onClick={navigateDataPage} type="primary"
          >{$t('menu.trainer.addDataButton')}</StandardButton>
      </TrainingStatusSection>
    {:else if sufficientData && !$state.isTraining && !$state.isPredicting}
      <TrainingStatusSection statusId="content.trainer.enoughdata.title">
        <TrainingButton onClick={trainModel} />
      </TrainingStatusSection>
    {:else if $state.isTraining}
      <TrainingStatusSection statusId="content.trainer.training.title">
        <img alt="loading" src={loadingSpinnerImage} width="100px" class="self-center" />
      </TrainingStatusSection>
    {:else if $state.isPredicting}
      <TrainingStatusSection statusId="content.trainer.trainingFinished.title">
        <div class="flex flexbox space-x-10">
          <StandardButton onClick={navigateDataPage} type="secondary"
            >{$t('menu.trainer.addMoreDataButton')}</StandardButton>
          <StandardButton onClick={navigateModelPage} type="primary"
            >{$t('menu.trainer.testModelButton')}</StandardButton>
        </div>
      </TrainingStatusSection>
    {/if}
  </div>
</div>
