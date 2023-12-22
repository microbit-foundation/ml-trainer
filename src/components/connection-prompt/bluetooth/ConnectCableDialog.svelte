<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardButton from '../../StandardButton.svelte';
  import { t } from '../../../i18n';
  import connectCableImage from '../../../imgs/connect-cable.gif';

  export let onNextClick: () => void;
  export let onBackClick: () => void;
  export let onSkipClick: () => void;
  export let currentStage: string;
</script>

<main>
  <div class="w-200 leading-10">
    <p class="font-bold text-2xl text-left pb-5">
      {#if currentStage === 'usb'}
        {$t('connectMB.connectCable.heading')}
      {:else if currentStage === 'usb1'}
        {$t('connectMB.connectCableMB1.heading')}
      {:else if currentStage === 'usb2'}
        {$t('connectMB.connectCableMB2.heading')}
      {/if}
    </p>
    <p class="leading-normal">
      {#if currentStage === 'usb'}
        {$t('connectMB.connectCable.subtitle')}
      {:else if currentStage === 'usb1'}
        {$t('connectMB.connectCableMB1.subtitle')}
      {:else if currentStage === 'usb2'}
        {$t('connectMB.connectCableMB2.subtitle')}
      {/if}
    </p>
    <img
      src={connectCableImage}
      alt="USB cable being connected at the top, centre of the micro:bit."
      class="px-55 py-5" />
  </div>
  <div class="flex justify-between">
    {#if currentStage === 'usb' || currentStage === 'usb1'}
      <StandardButton type="link" onClick={onSkipClick}
        >{$t('connectMB.connectCable.skip')}</StandardButton>
    {/if}
    <div class="flex gap-x-5 ml-auto">
      <StandardButton onClick={onBackClick}>{$t('connectMB.backButton')}</StandardButton>
      <StandardButton type="primary" onClick={onNextClick}
        >{$t('connectMB.nextButton')}</StandardButton>
    </div>
  </div>
</main>
