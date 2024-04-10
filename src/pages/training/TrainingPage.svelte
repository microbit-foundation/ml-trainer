<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { hasSufficientData, state } from '../../script/stores/uiStore';
  import { trainingStatus } from '../../script/stores/mlStore';
  import { t } from '../../i18n';
  import TrainingButton from './TrainingButton.svelte';
  import TabView from '../../views/TabView.svelte';
  import trainModelImage from '../../imgs/train_model_black.svg';
  import StandardButton from '../../components/StandardButton.svelte';
  import { Paths, getTitle, navigate } from '../../router/paths';
  import { trainModel } from '../../script/ml';
  import TrainingStatusSection from '../../components/TrainingStatusSection.svelte';
  import LoadingBar from '../../components/LoadingBar.svelte';
  import StandardDialog from '../../components/dialogs/StandardDialog.svelte';
  import { TrainingStatus } from '../../script/domain/Model';

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

  $: title = getTitle(Paths.TRAINING, $t);
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<StandardDialog
  isOpen={isFailedTrainingDialogOpen}
  onClose={() => (isFailedTrainingDialogOpen = false)}
  class="w-175 space-y-5">
  <svelte:fragment slot="heading">
    {$t('content.trainer.failure.header')}
  </svelte:fragment>
  <svelte:fragment slot="body">
    <div class="space-y-3">
      <p>
        {$t('content.trainer.failure.body')}
      </p>
      <p class="font-bold">
        {$t('content.trainer.failure.todo')}
      </p>
    </div>
  </svelte:fragment>
</StandardDialog>

<div class="flex flex-col items-center pb-5 bg-backgrounddark">
  <TabView />
  <main class="contents">
    <img class="pt-10 opacity-40 w-350px h-249px" src={trainModelImage} alt="" />
    <h1 class="text-2xl font-bold pb-3">{$t('content.trainer.header')}</h1>
    <p class="text-center leading-relaxed w-150">
      {$t('content.trainer.description')}
    </p>
    <div class="flex flex-col flex-grow justify-center items-center text-center">
      {#if !sufficientData}
        <TrainingStatusSection
          statusId="menu.trainer.notEnoughDataHeader1"
          descriptionId="menu.trainer.notEnoughDataInfoBody">
          <StandardButton onClick={navigateDataPage} type="primary"
            >{$t('menu.trainer.addDataButton')}</StandardButton>
        </TrainingStatusSection>
      {:else if sufficientData && !$state.isTraining && !$state.isPredicting && !$state.hasTrainedBefore}
        <TrainingStatusSection statusId="content.trainer.enoughdata.title">
          <TrainingButton onClick={trainModel} />
        </TrainingStatusSection>
      {:else if sufficientData && !$state.isTraining && !$state.isPredicting}
        <TrainingStatusSection statusId="content.trainer.retrain.title">
          <TrainingButton onClick={trainModel} />
        </TrainingStatusSection>
      {:else if $state.isTraining}
        <TrainingStatusSection statusId="content.trainer.training.title">
          <LoadingBar progress={$state.trainingProgress} />
        </TrainingStatusSection>
      {:else if $state.isPredicting}
        <TrainingStatusSection statusId="menu.trainer.TrainingFinished">
          <div class="flex flexbox space-x-10">
            <StandardButton onClick={navigateDataPage} type="secondary"
              >{$t('menu.trainer.addMoreDataButton')}</StandardButton>
            <StandardButton onClick={navigateModelPage} type="primary"
              >{$t('menu.trainer.testModelButton')}</StandardButton>
          </div>
        </TrainingStatusSection>
      {/if}
    </div>
  </main>
</div>
