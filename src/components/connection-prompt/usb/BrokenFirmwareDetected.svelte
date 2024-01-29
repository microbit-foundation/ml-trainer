<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../../../i18n';
  import { FlashStage } from '../../../script/microbit-interfacing/MicrobitsAlt';
  import DialogHeading from '../../DialogHeading.svelte';
  import HtmlFormattedMessage, { linkWithProps } from '../../HtmlFormattedMessage.svelte';
  import StandardButton from '../../StandardButton.svelte';
  import ExternalLinkIcon from 'virtual:icons/ri/external-link-line';

  export let onTryAgain: () => void;
  export let onSkip: () => void;
  export let onCancel: () => void;
  export let flashStage: FlashStage;
</script>

<div class="w-175">
  <DialogHeading>{$t('connectMB.usb.firmwareBroken.heading')}</DialogHeading>
  <div class="space-y-5">
    <p>
      {$t('connectMB.usb.firmwareBroken.content1')}
    </p>
    <p>
      <HtmlFormattedMessage
        id="connectMB.usb.firmwareBroken.content2"
        options={{
          values: {
            link: linkWithProps({
              href: 'https://microbit.org/get-started/user-guide/firmware/',
              target: '_blank',
              rel: 'noopener',
            }),
          },
        }} />
    </p>
    <p>
      <a
        class="inline-flex gap-x-1 items-center text-link outline-none focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:ring-ring"
        href="https://support.microbit.org/support/solutions/articles/19000105428-webusb-troubleshooting"
        target="_blank"
        rel="noopener">
        {$t('connectMB.usb.firmwareBroken.content3')}
        <ExternalLinkIcon />
      </a>
    </p>
    <div class="flex justify-end gap-x-5">
      <StandardButton onClick={onCancel}>{$t('actions.cancel')}</StandardButton>
      {#if flashStage === 'bluetooth'}
        <StandardButton onClick={onSkip}
          >{$t('connectMB.usb.firmwareBroken.skip')}</StandardButton>
      {/if}
      <StandardButton type="primary" onClick={onTryAgain}
        >{$t('connectMB.tryAgain')}</StandardButton>
    </div>
  </div>
</div>
