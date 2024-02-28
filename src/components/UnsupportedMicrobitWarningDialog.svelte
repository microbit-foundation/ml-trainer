<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../i18n';
  import { compatibility } from '../script/stores/uiStore';
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
  const linkWithPropsForMicrobitBluetoothSupport = linkWithProps({
    href: 'https://support.microbit.org/support/home',
    target: '_blank',
    rel: 'noopener',
  });
  const { bluetooth } = $compatibility;
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
      {#if bluetooth}
        <p>
          {$t('connectMB.unsupportedMicrobit.withBluetooth')}
        </p>
      {:else}
        <p>
          <HtmlFormattedMessage
            id={$t('connectMB.unsupportedMicrobit.withoutBluetooth')}
            options={{
              values: {
                link: linkWithPropsForMicrobitBluetoothSupport,
              },
            }} />
        </p>
      {/if}
    </div>
    <div class="flex justify-end">
      {#if bluetooth}
        <StandardButton onClick={onStartBluetoothClick} type="primary"
          >{$t('connectMB.unsupportedMicrobit.ctaWithBluetooth')}</StandardButton>
      {:else}
        <StandardButton onClick={onClose} type="primary"
          >{$t('actions.close')}</StandardButton>
      {/if}
    </div>
  </div>
</div>
