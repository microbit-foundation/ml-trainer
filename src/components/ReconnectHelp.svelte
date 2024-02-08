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
  import { stateOnHideReconnectHelp } from '../script/microbit-interfacing/state-updaters';

  export let isOpen: boolean = false;

  $: content = (() => {
    switch ($state.reconnectState.connectionType) {
      case 'bluetooth': {
        return {
          heading:
            $state.showReconnectHelp === 'userTriggered'
              ? 'reconnectFailed.bluetoothHeading'
              : 'disconnectedWarning.bluetoothHeading',
          subtitle:
            $state.showReconnectHelp === 'userTriggered'
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
            $state.showReconnectHelp === 'userTriggered'
              ? 'reconnectFailed.bridgeHeading'
              : 'disconnectedWarning.bridgeHeading',
          subtitle:
            $state.showReconnectHelp === 'userTriggered'
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
            $state.showReconnectHelp === 'userTriggered'
              ? 'reconnectFailed.remoteHeading'
              : 'disconnectedWarning.remoteHeading',
          subtitle:
            $state.showReconnectHelp === 'userTriggered'
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
</script>

{#if $state.reconnectState.connectionType !== 'none'}
  <StandardDialog {isOpen} onClose={stateOnHideReconnectHelp} class="w-150 space-y-5">
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
        <!-- TODO: actual support URL -->
        <a
          class="inline-flex mr-auto gap-x-1 items-center text-link outline-none focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:ring-ring"
          href="https://support.microbit.org"
          target="_blank"
          rel="noopener">
          {$t('connectMB.troubleshooting')}
          <ExternalLinkIcon />
        </a>
        <StandardButton onClick={stateOnHideReconnectHelp}
          >{$t('actions.cancel')}</StandardButton>
        <StandardButton type="primary" onClick={() => reconnect(true)}
          >{$t('actions.reconnect')}</StandardButton>
      </div>
    </svelte:fragment>
  </StandardDialog>
{/if}
