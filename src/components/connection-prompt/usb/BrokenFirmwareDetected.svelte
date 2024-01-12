<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../../../i18n';
  import {
    ConnectDialogStates,
    connectionDialogState,
  } from '../../../script/stores/connectDialogStore';
  import HtmlFormattedMessage, { linkWithProps } from '../../HtmlFormattedMessage.svelte';
  import StandardButton from '../../StandardButton.svelte';
</script>

<main>
  <div class="w-600px text-left">
    <h1 class="font-bold mb-5 text-center">
      {$t('connectMB.usb.header')}
    </h1>
    <p class="mb-3 mt-2 text-warning font-bold">
      {$t('connectMB.usb.firmwareBroken.warning')}
    </p>
    <p>
      {$t('connectMB.usb.firmwareBroken.content1')}
    </p>
    <p class="mt-2 font-bold">
      {$t('connectMB.usb.firmwareBroken.content2')}
    </p>

    <p class="mt-2">
      {$t('connectMB.usb.firmwareBroken.content3')}
    </p>

    <p class="mb-2">
      <HtmlFormattedMessage
        id="connectMB.usb.firmwareBroken.content4"
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
    <StandardButton
      onClick={() => {
        $connectionDialogState.connectionState = ConnectDialogStates.MANUAL_TUTORIAL;
      }}>{$t('connectMB.usb.firmwareBroken.button.skip')}</StandardButton>
  </div>
</main>
