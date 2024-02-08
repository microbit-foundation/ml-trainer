<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../i18n';
  import DialogHeading from './DialogHeading.svelte';
  import HtmlFormattedMessage, { linkWithProps } from './HtmlFormattedMessage.svelte';
  import StandardButton from './StandardButton.svelte';

  export let onClose: () => void;
  export let onStartBluetoothClick: () => void;

  const linkWithPropsForMicrobitVersionSupport = linkWithProps({
    href: 'https://support.microbit.org/support/solutions/articles/19000119162',
    target: '_blank',
    rel: 'noopener',
  });
</script>

<div class="w-175">
  <DialogHeading>{$t('connectMB.unsupportedMicrobit.header')}</DialogHeading>
  <div class="space-y-5">
    <div class="space-y-2">
      <p>
        <HtmlFormattedMessage
          id={$t('connectMB.unsupportedMicrobit.explain')}
          options={{
            values: {
              link: linkWithPropsForMicrobitVersionSupport,
            },
          }} />
      </p>
      <p>
        {$t('connectMB.unsupportedMicrobit.advice1')}
        <a
          role="button"
          tabindex="0"
          class="text-link outline-none focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:ring-ring cursor-pointer"
          on:click={onStartBluetoothClick}
          >{$t('connectMB.unsupportedMicrobit.advice2')}</a>
        <HtmlFormattedMessage
          id={$t('connectMB.unsupportedMicrobit.advice3')}
          options={{
            values: {
              link: linkWithPropsForMicrobitVersionSupport,
            },
          }} />
      </p>
    </div>
    <div class="flex justify-end">
      <StandardButton onClick={onClose} type="primary"
        >{$t('actions.close')}</StandardButton>
    </div>
  </div>
</div>
