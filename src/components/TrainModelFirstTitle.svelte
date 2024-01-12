<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../i18n';
  import testModelImage from '../imgs/TestModel.svg';
  import StandardButton from './StandardButton.svelte';
  import TrainingButton from '../pages/training/TrainingButton.svelte';
  import { Paths, navigate } from '../router/paths';
  import { hasSufficientData } from '../script/stores/uiStore';

  $: sufficientData = hasSufficientData();
</script>

<div class="flex flex-col items-center bg-backgrounddark pb-10">
  <img class="pt-10 opacity-40 w-350px h-249px" src={testModelImage} alt="" />
  <h1 class="text-2xl font-bold mb-3">
    {$t('content.model.trainModelFirstHeading')}
  </h1>
  <div class="space-y-5">
    <p>
      {$t('content.model.trainModelBody')}
    </p>
    {#if !sufficientData}
      <p>
        {$t('content.model.notEnoughDataInfoBody')}
      </p>
    {/if}
  </div>
  <div class="mt-10 flex gap-5">
    {#if !sufficientData}
      <StandardButton type="primary" onClick={() => navigate(Paths.DATA)}>
        {$t('content.model.addData')}
      </StandardButton>
    {:else}
      <TrainingButton type="primary" onClick={() => navigate(Paths.TRAINING)} />
    {/if}
  </div>
</div>
