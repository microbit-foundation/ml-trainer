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

    const instructionsVideoLink = "https://youtu.be/PC1rzFFhggU?feature=shared&t=63";

  </script>
  
  <main>
    <div class="w-200 leading-10">
      <p class="font-bold text-2xl text-left pb-5">
        {#if currentStage === 'usb'}
          {$t('connectMB.wearingSetup.bluetooth.heading')}
        {:else if currentStage === 'usb1'}
          {$t('connectMB.wearingSetup.radioConnection.heading')}
        {/if}
      </p>
      <p class="leading-normal">
        <a class="text-link" href={instructionsVideoLink} target="_blank"
          >{$t('connectMB.wearingSetup.subtitle1')}</a>
        {$t('connectMB.wearingSetup.subtitle2')}
      </p>
      <div class="flex flex-col font-semibold text-center py-10">
          <img src={microbitHolderImage} class="w-50 self-center pt-10"/>
          <p>{$t('connectMB.wearingSetup.requirements1')}</p>
          <img src={microbitStrapImage} class="w-150 self-center pt-10"/>
          <p>{$t('connectMB.wearingSetup.requirements2')}</p>
      </div>
    </div>
    <div class="flex">
      <div class="flex w-full justify-end gap-x-5">
        <StandardButton onClick={onBackClick}>{$t('connectMB.backButton')}</StandardButton>
        <StandardButton type="primary" onClick={onNextClick}
          >{$t('connectMB.nextButton')}</StandardButton>
      </div>
    </div>
  </main>
  