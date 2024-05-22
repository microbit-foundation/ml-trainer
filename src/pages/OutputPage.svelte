<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../i18n';
  import { Paths, getTitle, navigate } from '../router/paths';
  import { TrainingStatus } from '../script/domain/Model';
  import { trainingStatus } from '../script/stores/mlStore';
  import { hasSufficientData } from '../script/stores/uiStore';
  import TabView from '../views/TabView.svelte';
  import { MakeCodeEditor } from '@microbit-foundation/react-editor-embed';

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

<div class="flex flex-col items-center pb-5 bg-backgrounddark">
  <TabView />
  <main class="contents">
    <h1 class="text-2xl font-bold pb-3 pt-10">{$t('content.output.header')}</h1>
    <p class="text-center leading-relaxed w-150">
      {$t('content.output.description')}
    </p>
    <div class="flex flex-col flex-grow justify-center items-center text-center"></div>
  </main>
</div>
