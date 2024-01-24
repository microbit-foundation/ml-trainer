<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardButton from '../components/StandardButton.svelte';
  import { state } from '../script/stores/uiStore';
  import { t } from '../i18n';
  import { btPatternInput, btPatternOutput } from '../script/stores/connectionStore';
  import MBSpecs from '../script/microbit-interfacing/MBSpecs';
  import Microbits from '../script/microbit-interfacing/Microbits';
  import { DeviceRequestStates } from '../script/stores/connectDialogStore';
  import StandardDialog from './dialogs/StandardDialog.svelte';

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

  // When disconnected by lost connection, offer the option to attempt to reconnect
  let hideReconnectMessageAfterTimeout = false;
  state.subscribe(s => {
    if (s.offerReconnect) {
      hideReconnectMessageAfterTimeout = true;
    }
  });

  const reconnect = (connectState: DeviceRequestStates) => {
    hideReconnectMessageAfterTimeout = false;
    console.assert(connectState != DeviceRequestStates.NONE);
    const pairingPattern =
      connectState === DeviceRequestStates.INPUT ? $btPatternInput : $btPatternOutput;
    const name = MBSpecs.Utility.patternToName(pairingPattern);

    const connect = () => {
      if (connectState == DeviceRequestStates.INPUT) {
        return Microbits.assignBluetoothInput(name);
      }
      return Microbits.assignOutput(name);
    };

    void connect().then(didSucceed => {
      if (didSucceed) {
        $state.offerReconnect = false;
      }
    });
  };
</script>

<StandardDialog {isOpen} onClose={() => ($state.offerReconnect = false)} class="w-100">
  <p>{$t(dialogText.bodyId)}</p>
  <div class="flex justify-center">
    <StandardButton type="primary" onClick={() => reconnect($state.reconnectState)}
      >{$t(dialogText.buttonId)}</StandardButton>
  </div>
</StandardDialog>
