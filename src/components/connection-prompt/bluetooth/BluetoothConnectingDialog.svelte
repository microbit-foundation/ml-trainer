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
    isInputPatternValid,
  } from '../../../script/stores/connectionStore';
  import type { Writable } from 'svelte/store';
  import Microbits from '../../../script/microbit-interfacing/Microbits';
  import { DeviceRequestStates } from '../../../script/stores/connectDialogStore';
  import Environment from '../../../script/Environment';
  import StaticConfiguration from '../../../StaticConfiguration';
  import DialogHeading from '../../DialogHeading.svelte';
  import LoadingSpinner from '../../LoadingSpinner.svelte';

  // callbacks
  export let deviceState: DeviceRequestStates;
  export let onBluetoothConnected: () => void;

  let isConnecting = false;

  let attemptedToPairWithInvalidPattern = false;

  let patternMatrixState: Writable<boolean[]> =
    deviceState === DeviceRequestStates.INPUT ? btPatternInput : btPatternOutput;

  let timeoutProgress = 0;

  const connectBluetooth = () => {
    if (!isInputPatternValid()) {
      attemptedToPairWithInvalidPattern = true;
      return;
    }
    timeoutProgress = 0;
    if (isConnecting) {
      // Safeguard to prevent trying to connect multiple times at once
      return;
    }
    isConnecting = true;
    let name = MBSpecs.Utility.patternToName($patternMatrixState);
    const connectionResult = () => {
      if (deviceState == DeviceRequestStates.INPUT) {
        return Microbits.assignInput(name);
      } else {
        return Microbits.assignOutput(name);
      }
    };

    const interval = 50; // ms - Higher -> choppier animation. Lower -> smoother animation
    const timeoutInterval = setInterval(() => {
      timeoutProgress += interval / StaticConfiguration.connectTimeoutDuration;
    }, interval);
    const connectTimeout = setTimeout(() => {
      clearInterval(timeoutInterval);
      Environment.isInDevelopment && console.log('Connection timed out');
      onCatastrophicError();
    }, StaticConfiguration.connectTimeoutDuration);

    void connectionResult().then(didSucceed => {
      clearTimeout(connectTimeout);
      clearInterval(timeoutInterval);
      Environment.isInDevelopment && console.log('Connection result ', didSucceed);
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
    <p class="text-warning">{$t('connectMB.bluetooth.cancelledConnection')}</p>
  {/if}
  {#if attemptedToPairWithInvalidPattern}
    <p class="text-warning">{$t('connectMB.bluetooth.invalidPattern')}</p>
  {/if}
  {#if isConnecting}
    <!-- Show spinner while connecting -->
    <div class="flex flex-col gap-5 justify-center items-center mb-40px">
      <p>{$t('connectMB.bluetooth.connecting')}</p>
      <LoadingSpinner />
    </div>
  {/if}
</div>
