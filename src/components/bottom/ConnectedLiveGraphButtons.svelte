<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../../i18n';
  import TypingUtils from '../../script/TypingUtils';
  import { state } from '../../script/stores/uiStore';
  import StandardButton from '../StandardButton.svelte';
  import Microbits from '../../script/microbit-interfacing/Microbits';
  import { startConnectionProcess } from '../../script/stores/connectDialogStore';
  import { DeviceRequestStates } from '../../script/stores/connectDialogStore';
  import { btPatternInput, btPatternOutput } from '../../script/stores/connectionStore';
  import MBSpecs from '../../script/microbit-interfacing/MBSpecs';

  const handleInputDisconnectClick = () => {
    Microbits.expelInputAndOutput();
  };

  const handleOutputDisconnectClick = () => {
    Microbits.expelOutput();
  };

  const reconnectBluetooth = async (connectState: DeviceRequestStates) => {
    const pairingPattern =
      connectState === DeviceRequestStates.INPUT ? $btPatternInput : $btPatternOutput;
    const name = MBSpecs.Utility.patternToName(pairingPattern);
    let success;
    if (connectState == DeviceRequestStates.INPUT) {
      success = await Microbits.assignBluetoothInput(name);
    } else {
      success = await Microbits.assignOutput(name);
    }
    if (success) {
      $state.offerReconnect = false;
    }
  };

  const handleConnect = () => {
    if ($state.offerReconnect) {
      // TODO: This needs to be different for WebUSB and Web Bluetooth.
      reconnectBluetooth($state.reconnectState);
      return;
    }
    startConnectionProcess();
  };
</script>

<!-- These are the buttons that are present while the input micro:bit is connected-->
<div class="flex flex-row mr-4">
  {#if $state.isPredicting || $state.isTraining || $state.isOutputConnected}
    {#if $state.isOutputAssigned}
      <!-- Output is assigned -->
      {#if !$state.isOutputConnected || $state.isOutputReady}
        <!-- Output MB is not in the connection process -->
        <StandardButton
          onClick={handleOutputDisconnectClick}
          class="bg-white"
          type="secondary"
          size="small">{$t('menu.model.disconnect')}</StandardButton>
      {:else}
        <StandardButton onClick={TypingUtils.emptyFunction} type="primary" size="small"
          >{$t('menu.model.connect')}</StandardButton>
      {/if}
    {/if}
  {/if}
  <div class="ml-2">
    {#if !$state.isInputAssigned}
      <StandardButton onClick={handleConnect} type="primary" size="small"
        >{$t(
          $state.offerReconnect ? 'footer.reconnectButton' : 'footer.connectButton',
        )}</StandardButton>
    {:else}
      <StandardButton
        onClick={handleInputDisconnectClick}
        class="bg-white"
        type="secondary"
        size="small">{$t('footer.disconnectButton')}</StandardButton>
    {/if}
  </div>
</div>
