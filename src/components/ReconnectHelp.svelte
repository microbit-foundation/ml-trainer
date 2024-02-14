<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import ExternalLinkIcon from 'virtual:icons/ri/external-link-line';
  import StandardButton from './StandardButton.svelte';
  import { t } from '../i18n';
  import { state } from '../script/stores/uiStore';
  import { reconnect } from '../script/utils/reconnect';
  import StandardDialog from './dialogs/StandardDialog.svelte';
  import { stateOnHideConnectHelp } from '../script/microbit-interfacing/state-updaters';
  import { startConnectionProcess } from '../script/stores/connectDialogStore';

  export let isOpen: boolean = false;

  $: content = (() => {
    switch ($state.reconnectState.connectionType) {
      case 'bluetooth': {
        return {
          heading:
            $state.showConnectHelp === 'connect'
              ? 'connectFailed.bluetoothHeading'
              : $state.showConnectHelp === 'userReconnect'
                ? 'reconnectFailed.bluetoothHeading'
                : 'disconnectedWarning.bluetoothHeading',
          subtitle:
            $state.showConnectHelp === 'connect'
              ? 'connectFailed.bluetooth1'
              : $state.showConnectHelp === 'userReconnect'
                ? 'reconnectFailed.bluetooth1'
                : 'disconnectedWarning.bluetooth1',
          listHeading: 'disconnectedWarning.bluetooth2',
          bulletOne: 'disconnectedWarning.bluetooth3',
          bulletTwo: 'disconnectedWarning.bluetooth4',
        };
      }
      case 'bridge': {
        return {
          heading:
            $state.showConnectHelp === 'connect'
              ? 'connectFailed.bridgeHeading'
              : $state.showConnectHelp === 'userReconnect'
                ? 'reconnectFailed.bridgeHeading'
                : 'disconnectedWarning.bridgeHeading',
          subtitle:
            $state.showConnectHelp === 'connect'
              ? 'connectFailed.bridge1'
              : $state.showConnectHelp === 'userReconnect'
                ? 'reconnectFailed.bridge1'
                : 'disconnectedWarning.bridge1',
          listHeading: 'connectMB.usbTryAgain.replugMicrobit2',
          bulletOne: 'connectMB.usbTryAgain.replugMicrobit3',
          bulletTwo: 'connectMB.usbTryAgain.replugMicrobit4',
        };
      }
      case 'remote': {
        return {
          heading:
            $state.showConnectHelp === 'connect'
              ? 'connectFailed.remoteHeading'
              : $state.showConnectHelp === 'userReconnect'
                ? 'reconnectFailed.remoteHeading'
                : 'disconnectedWarning.remoteHeading',
          subtitle:
            $state.showConnectHelp === 'connect'
              ? 'connectFailed.remote1'
              : $state.showConnectHelp === 'userReconnect'
                ? 'reconnectFailed.remote1'
                : 'disconnectedWarning.remote1',
          listHeading: 'disconnectedWarning.bluetooth2',
          bulletOne: 'disconnectedWarning.bluetooth3',
          bulletTwo: 'disconnectedWarning.bluetooth4',
        };
      }
      default: {
        return {
          heading: '',
          subtitle: '',
          listHeading: '',
          bulletOne: '',
          bulletTwo: '',
        };
      }
    }
  })();

  const handleReconnect = () => {
    if ($state.showConnectHelp === 'connect') {
      stateOnHideConnectHelp();
      startConnectionProcess();
    } else {
      reconnect(true);
    }
  };
</script>

{#if $state.reconnectState.connectionType !== 'none'}
  <StandardDialog {isOpen} onClose={stateOnHideConnectHelp} class="w-150 space-y-5">
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
          href="https://support.microbit.org/a/solutions/articles/19000157495"
          target="_blank"
          rel="noopener">
          {$t('connectMB.troubleshooting')}
          <ExternalLinkIcon />
        </a>
        <StandardButton onClick={stateOnHideConnectHelp}
          >{$t('actions.cancel')}</StandardButton>
        <StandardButton type="primary" onClick={handleReconnect}
          >{$t(
            $state.showConnectHelp === 'connect'
              ? 'footer.connectButton'
              : 'actions.reconnect',
          )}</StandardButton>
      </div>
    </svelte:fragment>
  </StandardDialog>
{/if}
