<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import ExternalLinkIcon from 'virtual:icons/ri/external-link-line';
  import StandardButton from './StandardButton.svelte';
  import { t } from '../i18n';
  import { stateOnStopOfferingReconnect } from '../script/microbit-interfacing/state-updaters';
  import { state } from '../script/stores/uiStore';
  import { reconnect } from '../script/utils/reconnect';
  import StandardDialog from './dialogs/StandardDialog.svelte';

  export let isOpen: boolean = false;

  $: content = (() => {
    switch ($state.reconnectState.connectionType) {
      case 'bluetooth': {
        return {
          heading: $state.showReconnectHelp
            ? `disconnectedWarning.bluetoothHeading`
            : 'reconnectFailed.bluetoothHeading',
          subtitle: $state.showReconnectHelp
            ? `disconnectedWarning.bluetooth1`
            : 'reconnectFailed.bluetooth1',
          listHeading: 'disconnectedWarning.bluetooth2',
          bulletOne: 'disconnectedWarning.bluetooth3',
          bulletTwo: 'disconnectedWarning.bluetooth4',
        };
      }
      case 'bridge': {
        return {
          heading: $state.showReconnectHelp
            ? `disconnectedWarning.bridgeHeading`
            : 'reconnectFailed.bridgeHeading',
          subtitle: $state.showReconnectHelp
            ? `disconnectedWarning.bridge1`
            : 'reconnectFailed.bridge1',
          listHeading: 'connectMB.usbTryAgain.replugMicrobit2',
          bulletOne: 'connectMB.usbTryAgain.replugMicrobit3',
          bulletTwo: 'connectMB.usbTryAgain.replugMicrobit4',
        };
      }
      case 'remote': {
        return {
          heading: $state.showReconnectHelp
            ? `disconnectedWarning.remoteHeading`
            : 'reconnectFailed.remoteHeading',
          subtitle: $state.showReconnectHelp
            ? `disconnectedWarning.remote1`
            : 'reconnectFailed.remote1',
          listHeading: 'disconnectedWarning.bluetooth2',
          bulletOne: 'disconnectedWarning.bluetooth3',
          bulletTwo: 'disconnectedWarning.bluetooth4',
        };
      }
      default: {
        return {
          heading: 'disconnectedWarning.bluetoothHeading',
          subtitle: '',
          listHeading: '',
          bulletOne: '',
          bulletTwo: '',
        };
      }
    }
  })();
</script>

{#if $state.reconnectState.connectionType !== 'none'}
  <StandardDialog {isOpen} onClose={stateOnStopOfferingReconnect} class="w-150 space-y-5">
    <svelte:fragment slot="heading">
      {$t(content.heading)}
    </svelte:fragment>
    <svelte:fragment slot="body">
      <p>{$t(content.subtitle)}</p>
      <div>
        <p>{$t(content.listHeading)}</p>
        <ul class="list-disc pl-10">
          <li>{$t(content.bulletOne)}</li>
          <li>{$t(content.bulletTwo)}</li>
        </ul>
      </div>

      <div class="flex justify-end gap-x-5">
        <a
          class="inline-flex mr-auto gap-x-1 items-center text-link outline-none focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:ring-ring"
          href=""
          target="_blank"
          rel="noopener">
          {$t('connectMB.troubleshooting')}
          <ExternalLinkIcon />
        </a>
        <StandardButton onClick={stateOnStopOfferingReconnect}
          >{$t('actions.cancel')}</StandardButton>
        <StandardButton type="primary" onClick={reconnect}
          >{$t('actions.reconnect')}</StandardButton>
      </div>
    </svelte:fragment>
  </StandardDialog>
{/if}
