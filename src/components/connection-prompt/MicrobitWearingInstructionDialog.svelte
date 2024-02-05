<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardButton from '../StandardButton.svelte';
  import { t } from '../../i18n.ts';
  import microbitStrapImage from '../../imgs/microbit_strap.png';
  import microbitHolderImage from '../../imgs/microbit_holder.png';
  import DialogHeading from '../DialogHeading.svelte';
  import HtmlFormattedMessage, { linkWithProps } from '../HtmlFormattedMessage.svelte';
  import { FlashStage } from '../../script/microbit-interfacing/Microbits.ts';

  export let onNextClick: () => void;
  export let onBackClick: () => void;
  export let flashStage: FlashStage;

  const instructionsVideoLink = 'https://youtu.be/PC1rzFFhggU?feature=shared&t=63';
</script>

<div class="w-175">
  <DialogHeading>
    {#if flashStage === 'bluetooth'}
      {$t('connectMB.wearingSetup.bluetooth.heading')}
    {:else if flashStage === 'radio-remote'}
      {$t('connectMB.wearingSetup.radioConnection.heading')}
    {/if}
  </DialogHeading>
  <div class="space-y-10">
    <p class="leading-normal">
      <HtmlFormattedMessage
        id="connectMB.wearingSetup.subtitle"
        options={{
          values: {
            link: linkWithProps({
              href: instructionsVideoLink,
              target: '_blank',
              rel: 'noopener',
            }),
          },
        }} />
    </p>
    <div class="flex flex-col font-semibold items-center gap-8">
      <div class="flex flex-col items-center gap-y-2">
        <img src={microbitHolderImage} class="w-50 h-23" alt="" />
        <p>{$t('connectMB.wearingSetup.requirements1')}</p>
      </div>
      <div class="flex flex-col items-center gap-y-2">
        <img src={microbitStrapImage} class="w-150 h-66px" alt="" />
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
