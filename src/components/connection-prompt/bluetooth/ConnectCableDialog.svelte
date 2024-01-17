<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardButton from '../../StandardButton.svelte';
  import { t } from '../../../i18n';
  import connectCableImage from '../../../imgs/connect-cable.gif';
  import DialogHeading from '../../DialogHeading.svelte';
  import Environment from '../../../script/Environment';

  export let onNextClick: () => void;
  export let onBackClick: () => void;
  export let onAltOrSkipClick: () => void;
  export let currentStage: string;
</script>

<div class="w-175">
  <DialogHeading>
    {#if currentStage === 'usb'}
      {$t('connectMB.connectCable.heading')}
    {:else if currentStage === 'usb1'}
      {$t('connectMB.connectCableMB1.heading')}
    {:else if currentStage === 'usb2'}
      {$t('connectMB.connectCableMB2.heading')}
    {/if}
  </DialogHeading>
  <div class="space-y-5">
    <p>
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
      alt={$t('connectMB.connectCable.altText')}
      class="w-65 h-241px mx-auto" />
  </div>
</div>
<div class="flex justify-between pt-5">
  {#if currentStage === 'usb' || (currentStage === 'usb1' && Environment.isInDevelopment)}
    <StandardButton type="link" onClick={onAltOrSkipClick}
      >{$t('connectMB.connectCable.skip')}</StandardButton>
  {/if}
  {#if currentStage === 'usb2'}
    <StandardButton type="link" onClick={onAltOrSkipClick}
      >{$t('connectMB.radioStart.switchBluetooth')}</StandardButton>
  {/if}
  <div class="flex gap-x-5 ml-auto">
    <StandardButton onClick={onBackClick}>{$t('connectMB.backButton')}</StandardButton>
    <StandardButton type="primary" onClick={onNextClick}
      >{$t('connectMB.nextButton')}</StandardButton>
  </div>
</div>
