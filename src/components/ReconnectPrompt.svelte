<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardButton from '../components/StandardButton.svelte';
  import { state } from '../script/stores/uiStore';
  import { t } from '../i18n';
  import { DeviceRequestStates } from '../script/stores/connectDialogStore';
  import StandardDialog from './dialogs/StandardDialog.svelte';
  import { startConnectionProcess } from '../script/stores/connectDialogStore';

  export let isOpen: boolean = false;

  const dialogText =
    $state.reconnectState === DeviceRequestStates.INPUT
      ? {
          bodyId: 'disconnectedWarning.input',
          buttonId: 'disconnectedWarning.reconnectButton.input',
        }
      : {
          bodyId: 'disconnectedWarning.output',
          buttonId: 'disconnectedWarning.reconnectButton.output',
        };

  const stopOfferingReconnect = () => {
    $state.offerReconnect = false;
  };
  const reconnect = () => {
    startConnectionProcess();
    stopOfferingReconnect();
  };
</script>

<StandardDialog {isOpen} onClose={stopOfferingReconnect} class="w-100">
  <p>{$t(dialogText.bodyId)}</p>
  <div class="flex justify-center">
    <StandardButton type="primary" onClick={reconnect}
      >{$t(dialogText.buttonId)}</StandardButton>
  </div>
</StandardDialog>
