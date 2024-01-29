<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../../i18n';
  import TypingUtils from '../../script/TypingUtils';
  import { state } from '../../script/stores/uiStore';
  import StandardButton from '../StandardButton.svelte';
  import Microbits from '../../script/microbit-interfacing/MicrobitsAlt';
  import {
    DeviceRequestStates,
    startConnectionProcess,
  } from '../../script/stores/connectDialogStore';

  const handleInputDisconnectClick = () => {
    Microbits.disconnect(DeviceRequestStates.INPUT);
  };

  const handleOutputDisconnectClick = () => {
    Microbits.disconnect(DeviceRequestStates.OUTPUT);
  };

  const handleInputConnect = () => {
    const name = Microbits.getDeviceName(DeviceRequestStates.INPUT);
    if (name) {
      // We need to know if we're WebSerial or Web Bluetooth...
      // MicrobitsAlt.assignBluetoothInput(name);
      Microbits.assignSerialInput(name);
    } else {
      startConnectionProcess();
    }
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
    {#if !$state.isInputConnected}
      <StandardButton onClick={handleInputConnect} type="primary" size="small"
        >{$t(
          $state.offerReconnect || $state.isInputAssigned
            ? 'footer.reconnectButton'
            : 'footer.connectButton',
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
