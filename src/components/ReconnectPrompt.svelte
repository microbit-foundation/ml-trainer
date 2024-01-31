<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../i18n';
  import { startConnectionProcess } from '../script/stores/connectDialogStore';
  import { state } from '../script/stores/uiStore';
  import StandardButton from './StandardButton.svelte';
  import StandardDialog from './dialogs/StandardDialog.svelte';
  import ExternalLinkIcon from 'virtual:icons/ri/external-link-line';

  export let isOpen: boolean = false;
  export let type: 'generic' | 'bluetooth' | 'bridge' | 'remote' = 'generic';
  export let trigger: 'automatic' | 'user' = 'automatic';

  const stopOfferingReconnect = () => {
    $state.offerReconnect = false;
  };
  const reconnect = () => {
    startConnectionProcess();
    stopOfferingReconnect();
  };

  const content = {
    heading: '',
    subtitle: '',
    listHeading: '',
    bulletOne: '',
    bulletTwo: '',
  };

  const textIdPrefix =
    trigger === 'automatic' ? 'disconnectedWarning' : 'reconnectFailed';

  switch (type) {
    case 'bluetooth': {
      content.heading =
        trigger === 'automatic'
          ? `disconnectedWarning.bluetoothHeading`
          : 'reconnectFailed.bluetoothHeading';
      content.subtitle =
        trigger === 'automatic'
          ? `disconnectedWarning.bluetooth1`
          : 'reconnectFailed.bluetooth1';
      content.listHeading = 'disconnectedWarning.bluetooth2';
      content.bulletOne = 'disconnectedWarning.bluetooth3';
      content.bulletTwo = 'disconnectedWarning.bluetooth4';
      break;
    }
    case 'bridge': {
      content.heading =
        trigger === 'automatic'
          ? `disconnectedWarning.bridgeHeading`
          : 'reconnectFailed.bridgeHeading';
      content.subtitle =
        trigger === 'automatic'
          ? `disconnectedWarning.bridge1`
          : 'reconnectFailed.bridge1';
      content.listHeading = 'connectMB.usbTryAgain.replugMicrobit2';
      content.bulletOne = 'connectMB.usbTryAgain.replugMicrobit3';
      content.bulletTwo = 'connectMB.usbTryAgain.replugMicrobit4';
      break;
    }
    case 'remote': {
      content.heading =
        trigger === 'automatic'
          ? `disconnectedWarning.remoteHeading`
          : 'reconnectFailed.remoteHeading';
      content.subtitle =
        trigger === 'automatic'
          ? `disconnectedWarning.remote1`
          : 'reconnectFailed.remote1';
      content.listHeading = 'disconnectedWarning.bluetooth2';
      content.bulletOne = 'disconnectedWarning.bluetooth3';
      content.bulletTwo = 'disconnectedWarning.bluetooth4';
      break;
    }
    default: {
      content.heading = `${textIdPrefix}.bluetoothHeading`;
    }
  }
</script>

<StandardDialog {isOpen} onClose={stopOfferingReconnect} class="w-150 space-y-5">
  <svelte:fragment slot="heading">
    {$t(content.heading)}
  </svelte:fragment>
  <svelte:fragment slot="body">
    {#if type !== 'generic'}
      <p>{$t(content.subtitle)}</p>
      <div>
        <p>{$t(content.listHeading)}</p>
        <ul class="list-disc pl-10">
          <li>{$t(content.bulletOne)}</li>
          <li>{$t(content.bulletTwo)}</li>
        </ul>
      </div>
    {:else}
      <p>{$t('disconnectedWarning.input')}</p>
    {/if}
    <div class="flex justify-end gap-x-5">
      {#if type !== 'generic'}
        <a
          class="inline-flex mr-auto gap-x-1 items-center text-link outline-none focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:ring-ring"
          href=""
          target="_blank"
          rel="noopener">
          {$t('connectMB.troubleshooting')}
          <ExternalLinkIcon />
        </a>
      {/if}
      <StandardButton onClick={stopOfferingReconnect}
        >{$t('actions.cancel')}</StandardButton>
      <StandardButton type="primary" onClick={reconnect}
        >{$t('disconnectedWarning.reconnectButton')}</StandardButton>
    </div>
  </svelte:fragment>
</StandardDialog>
