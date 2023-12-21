<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardButton from '../StandardButton.svelte';
  import { t } from '../../i18n.ts';
  import microbitStrapImage from '../../imgs/microbit_strap.png';
  import microbitHolderImage from '../../imgs/microbit_holder.png';

  export let onNextClick: () => void;
  export let onBackClick: () => void;
  export let currentStage: string;

  const instructionsVideoLink = 'https://youtu.be/PC1rzFFhggU?feature=shared&t=63';
</script>

<main>
  <div class="w-200">
    <p class="font-bold text-2xl text-left leading-10">
      {#if currentStage === 'usb'}
        {$t('connectMB.wearingSetup.bluetooth.heading')}
      {:else if currentStage === 'usb1'}
        {$t('connectMB.wearingSetup.radioConnection.heading')}
      {/if}
    </p>
    <div class="space-y-10 mt-5">
      <p class="leading-normal">
        <a class="text-link" href={instructionsVideoLink} target="_blank" rel="noopener"
          >{$t('connectMB.wearingSetup.subtitle1')}</a>
        {$t('connectMB.wearingSetup.subtitle2')}
      </p>
      <div class="flex flex-col font-semibold items-center gap-8">
        <div class="flex flex-col items-center gap-y-2">
          <img src={microbitHolderImage} class="w-50" alt="" />
          <p>{$t('connectMB.wearingSetup.requirements1')}</p>
        </div>
        <div class="flex flex-col items-center gap-y-2">
          <img src={microbitStrapImage} class="w-150" alt="" />
          <p>{$t('connectMB.wearingSetup.requirements2')}</p>
        </div>
      </div>
    </div>
    <div class="flex justify-end gap-x-5 mt-8">
      <StandardButton onClick={onBackClick}>{$t('connectMB.backButton')}</StandardButton>
      <StandardButton type="primary" onClick={onNextClick}
        >{$t('connectMB.nextButton')}</StandardButton>
    </div>
  </div>
</main>
