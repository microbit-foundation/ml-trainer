<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import MBSpecs from '../../../script/microbit-interfacing/MBSpecs';
  import { t } from '../../../i18n';
  import { onDestroy, onMount } from 'svelte';
  import { onCatastrophicError, state } from '../../../script/stores/uiStore';
  import {
    btPatternInput,
    btPatternOutput,
  } from '../../../script/stores/connectionStore';
  import type { Writable } from 'svelte/store';
  import { DeviceRequestStates } from '../../../script/stores/connectDialogStore';
  import StaticConfiguration from '../../../StaticConfiguration';
  import DialogHeading from '../../DialogHeading.svelte';
  import LoadingSpinner from '../../LoadingSpinner.svelte';
  import StandardButton from '../../StandardButton.svelte';
  import { isDevMode } from '../../../script/environment';
  import Microbits from '../../../script/microbit-interfacing/Microbits';

  // callbacks
  export let deviceState: DeviceRequestStates;
  export let onBluetoothConnected: () => void;
  export let onCancel: () => void;
  export let onReconnectBluetooth: () => void;

  let isConnecting = false;

  let patternMatrixState: Writable<boolean[]> =
    deviceState === DeviceRequestStates.INPUT ? btPatternInput : btPatternOutput;

  let timeoutProgress = 0;

  const connectBluetooth = () => {
    timeoutProgress = 0;
    if (isConnecting) {
      // Safeguard to prevent trying to connect multiple times at once
      return;
    }
    isConnecting = true;
    let name = MBSpecs.Utility.patternToName($patternMatrixState);
    const connectionResult = () => {
      if (deviceState == DeviceRequestStates.INPUT) {
        return Microbits.assignBluetoothInput(name);
      } else {
        return Microbits.assignBluetoothOuput(name);
      }
    };

    const interval = 50; // ms - Higher -> choppier animation. Lower -> smoother animation
    const timeoutInterval = setInterval(() => {
      timeoutProgress += interval / StaticConfiguration.connectTimeoutDuration;
    }, interval);
    const connectTimeout = setTimeout(() => {
      clearInterval(timeoutInterval);
      isDevMode && console.log('Connection timed out');
      onCatastrophicError();
    }, StaticConfiguration.connectTimeoutDuration);

    void connectionResult().then(didSucceed => {
      clearTimeout(connectTimeout);
      clearInterval(timeoutInterval);
      isDevMode && console.log('Connection result ', didSucceed);
      if (didSucceed) {
        onBluetoothConnected();
      } else {
        isConnecting = false;
      }
    });
  };

  function connectOnEnterClick(event: KeyboardEvent): void {
    if (event.code !== 'Enter') {
      return;
    }
    void connectBluetooth();
  }

  onMount(() => {
    // Resets the bluetooth connection prompt for cancelled device requests
    $state.requestDeviceWasCancelled = false;

    document.addEventListener('keypress', connectOnEnterClick);
    connectBluetooth();
  });

  onDestroy(() => {
    document.removeEventListener('keypress', connectOnEnterClick);
  });
</script>

<div class="w-175">
  <DialogHeading>
    {$t('connectMB.bluetooth.heading')}
  </DialogHeading>
  {#if $state.requestDeviceWasCancelled && !isConnecting}
    <div class="flex flex-col gap-y-5">
      <p>{$t('connectMB.bluetooth.cancelledConnection')}</p>
      <div class="flex justify-end gap-x-5">
        <StandardButton onClick={onCancel}>{$t('actions.cancel')}</StandardButton>
        <StandardButton type="primary" onClick={onReconnectBluetooth}
          >{$t('connectMB.tryAgain')}</StandardButton>
      </div>
    </div>
  {/if}
  {#if isConnecting}
    <!-- Show spinner while connecting -->
    <div class="flex flex-col gap-5 justify-center items-center mb-40px">
      <p>{$t('connectMB.connecting')}</p>
      <LoadingSpinner />
    </div>
  {/if}
</div>
