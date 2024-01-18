<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { horizontalSlide } from '../script/transitions';
  import StandardButton from '../components/StandardButton.svelte';
  import { state } from '../script/stores/uiStore';
  import { t } from '../i18n';
  import { btPatternInput, btPatternOutput } from '../script/stores/connectionStore';
  import MBSpecs from '../script/microbit-interfacing/MBSpecs';
  import Microbits from '../script/microbit-interfacing/Microbits';
  import { DeviceRequestStates } from '../script/stores/connectDialogStore';

  let reconnectText: string;
  let reconnectButtonText: string;

  state.subscribe(s => {
    if (s.reconnectState === DeviceRequestStates.INPUT) {
      reconnectText = $t('disconnectedWarning.input');
      reconnectButtonText = $t('disconnectedWarning.reconnectButton.input');
    } else if (s.reconnectState === DeviceRequestStates.OUTPUT) {
      reconnectText = $t('disconnectedWarning.output');
      reconnectButtonText = $t('disconnectedWarning.reconnectButton.output');
    }
  });
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

<div
  class="absolute top-8 right-4 bg-white rounded-md p-6 border-1 border-black z-5"
  transition:horizontalSlide>
  <div class="w-100">
    <div class="absolute right-2 top-2 svelte-1rnkjvh">
      <button
        class="hover:bg-gray-100 rounded outline-transparent w-8 svelte-1rnkjvh"
        on:click={() => ($state.offerReconnect = false)}>
        <i
          class="fas fa-plus text-lg text-gray-600 hover:text-gray-800 duration-75 svelte-1rnkjvh"
          style="transform: rotate(45deg);" />
      </button>
    </div>
    <p>{reconnectText}</p>
    <div class="flex justify-center">
      <StandardButton onClick={() => reconnect($state.reconnectState)}
        >{reconnectButtonText}</StandardButton>
    </div>
  </div>
</div>
