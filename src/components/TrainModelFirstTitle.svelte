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
</script>

<div class="flex flex-col items-center bg-backgrounddark pb-10">
  <img
    class="pt-10 opacity-40"
    src={testModelImage}
    alt={$t('content.model.imageAlt')}
    width="350" />
  <h2 class="text-2xl font-bold mb-3">
    {$t('content.model.trainModelFirstHeading')}
  </h2>
  <p class="mb-5">
    {$t('content.model.trainModelBody1')}
  </p>
  <p class="mb-10">
    {$t('content.model.trainModelBody2')}
  </p>
  <div class="flex gap-5">
    <StandardButton onClick={() => navigate(Paths.DATA)}>
      {$t('content.model.addData')}
    </StandardButton>
    <TrainingButton type="secondary" onClick={() => navigate(Paths.TRAINING)} />
  </div>
</div>
