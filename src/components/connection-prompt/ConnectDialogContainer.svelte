<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardDialog from '../dialogs/StandardDialog.svelte';
  import StartRadioDialog from './radio/StartRadioDialog.svelte';
  import StartBluetoothDialog from './bluetooth/StartBluetoothDialog.svelte';
  import ConnectCableDialog from './bluetooth/ConnectCableDialog.svelte';
  import SelectMicrobitDialogUsb from './usb/SelectMicrobitDialogUsb.svelte';
  import ConnectBatteryDialog from './bluetooth/ConnectBatteryDialog.svelte';
  import BluetoothConnectDialog from './bluetooth/BluetoothConnectDialog.svelte';
  import DownloadingDialog from './usb/DownloadingDialog.svelte';
  import ManualInstallTutorial from './usb/manual/ManualInstallTutorial.svelte';
  import {
    ConnectDialogStates,
    connectionDialogState,
    DeviceRequestStates,
  } from '../../script/stores/connectDialogStore';
  import Microbits, {
    FlashStage,
    HexType,
  } from '../../script/microbit-interfacing/Microbits';
  import { btPatternInput, btPatternOutput } from '../../script/stores/connectionStore';
  import MBSpecs from '../../script/microbit-interfacing/MBSpecs';
  import BrokenFirmwareDetected from './usb/BrokenFirmwareDetected.svelte';
  import BluetoothConnectingDialog from './bluetooth/BluetoothConnectingDialog.svelte';
  import SelectMicrobitDialogBluetooth from './bluetooth/SelectMicrobitDialogBluetooth.svelte';
  import MicrobitWearingInstructionDialog from './MicrobitWearingInstructionDialog.svelte';
  import WebUsbTryAgain, { USBTryAgainType } from './WebUsbTryAgain.svelte';
  import { onDestroy, onMount } from 'svelte';
  import { get, Unsubscriber } from 'svelte/store';
  import { compatibility } from '../../script/stores/uiStore';
  import { isDevMode } from '../../script/environment';
  import { flags } from '../../script/flags';
  import ConnectingMicrobits from './radio/ConnectingMicrobits.svelte';

  const { bluetooth, usb } = get(compatibility);
  let endOfFlow = false;
  let flashStage: FlashStage = usb ? 'bluetooth' : 'radio-sender';
  let usbTryAgainType: USBTryAgainType = 'replug microbit';
  let flashProgress = 0;

  const stageToHex = (flashStage: FlashStage): HexType => {
    if (flashStage === 'bluetooth') {
      return 'bluetooth';
    }
    if (flags.radioLocal) {
      return 'radio-local';
    }
    if (flashStage === 'radio-sender') {
      return 'radio-sender';
    }
    return 'radio-bridge';
  };

  const handleWebUSBError = (err: any) => {
    switch (typeof err) {
      // Error during flashing process
      case 'object':
        // We might get Error objects as Promise rejection arguments
        if (!err.message && err.promise && err.reason) {
          err = err.reason;
        }
        // This is somewhat fragile but worth it for scenario specific errors.
        // These messages changed to be prefixed in 2023 so we've relaxed the checks.
        if (/No valid interfaces found/.test(err.message)) {
          // This comes from DAPjs's WebUSB open.
          $connectionDialogState.connectionState = ConnectDialogStates.BAD_FIRMWARE;
          break;
        } else if (/No device selected/.test(err.message)) {
          $connectionDialogState.connectionState = ConnectDialogStates.USB_TRY_AGAIN;
          usbTryAgainType = 'select microbit';
          break;
        } else if (/Unable to claim interface/.test(err.message)) {
          $connectionDialogState.connectionState = ConnectDialogStates.USB_TRY_AGAIN;
          usbTryAgainType = 'close tabs';
          break;
        } else {
          // Unhandled error. User will need to reconnect their micro:bit
          $connectionDialogState.connectionState = ConnectDialogStates.USB_TRY_AGAIN;
          usbTryAgainType = 'replug microbit';
          break;
        }
      default: {
        $connectionDialogState.connectionState = ConnectDialogStates.USB_TRY_AGAIN;
        usbTryAgainType = 'replug microbit';
      }
    }
  };

  const handleConnectionError = (err: any) => {
    if (flashStage === 'bluetooth') {
      $connectionDialogState.connectionState = ConnectDialogStates.MANUAL_TUTORIAL;
    } else {
      handleWebUSBError(err);
    }
  };

  async function tryMicrobitConnection(): Promise<void> {
    try {
      await Microbits.linkMicrobit();
    } catch (err) {
      handleConnectionError(err);
      return;
    }
    const friendlyName = await getMicrobitName();
    if (!friendlyName) {
      return;
    }
    return flashMicrobit(friendlyName);
  }

  async function getMicrobitName(): Promise<string | undefined> {
    try {
      const friendlyName = await Microbits.getLinkedFriendlyName();
      // Find the name of the micro:bit
      if ($connectionDialogState.deviceState === DeviceRequestStates.OUTPUT) {
        btPatternOutput.set(MBSpecs.Utility.nameToPattern(friendlyName));
      } else {
        btPatternInput.set(MBSpecs.Utility.nameToPattern(friendlyName));
      }
      return friendlyName;
    } catch (err) {
      handleConnectionError(err);
    }
  }

  async function flashMicrobit(friendlyName: string): Promise<void> {
    const hexForStage = stageToHex(flashStage);
    try {
      await Microbits.flashHexToLinked(hexForStage, progress => {
        // Flash hex
        // Send users to download screen
        if (
          $connectionDialogState.connectionState != ConnectDialogStates.USB_DOWNLOADING
        ) {
          $connectionDialogState.connectionState = ConnectDialogStates.USB_DOWNLOADING;
        }
        flashProgress = progress;
      });
      // Finished flashing successfully
      if (flashStage === 'bluetooth' || flashStage === 'radio-sender') {
        $connectionDialogState.connectionState = ConnectDialogStates.CONNECT_BATTERY;
      } else if (flashStage === 'radio-bridge') {
        onConnectingSerial(friendlyName);
      }
    } catch (err) {
      handleConnectionError(err);
    }
  }

  function onFoundBluetoothDevice(): void {
    $connectionDialogState.connectionState = ConnectDialogStates.BLUETOOTH_CONNECTING;
  }

  async function onConnectingSerial(name: string): Promise<void> {
    $connectionDialogState.connectionState = ConnectDialogStates.CONNECTING_MICROBITS;
    await Microbits.assignSerialInput(name);
    endFlow();
    // MicrobitSerial.connect(Microbits.getLinked()).catch(() => {
    //   // Errors to consider: microbit is disconnected, some sort of connection error
    // });
  }

  function connectionStateNone() {
    setTimeout(() => {
      $connectionDialogState.connectionState = ConnectDialogStates.NONE;
      endOfFlow = false;
    }, 200);
  }

  function endFlow() {
    endOfFlow = true;
    connectionStateNone();
  }

  let dialogContainer: HTMLElement;
  let unsubscribe: Unsubscriber;

  onMount(() => {
    // Focus the first button in the dialog when the content changes.
    unsubscribe = connectionDialogState.subscribe(({ connectionState }) => {
      if (connectionState !== ConnectDialogStates.NONE && !endOfFlow) {
        const button = dialogContainer.querySelector('button');
        if (button) {
          button.focus();
        }
      }
    });
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
</script>

<div bind:this={dialogContainer}>
  <StandardDialog
    isOpen={$connectionDialogState.connectionState !== ConnectDialogStates.NONE &&
      !endOfFlow}
    onClose={connectionStateNone}
    hasCloseButton={$connectionDialogState.connectionState !==
      ConnectDialogStates.USB_DOWNLOADING}
    closeOnOutsideClick={false}
    closeOnEscape={$connectionDialogState.connectionState !==
      ConnectDialogStates.USB_DOWNLOADING}>
    {#if $connectionDialogState.connectionState === ConnectDialogStates.START_RADIO}
      <StartRadioDialog
        onStartBluetoothClick={bluetooth
          ? () => {
              $connectionDialogState.connectionState =
                ConnectDialogStates.START_BLUETOOTH;
              flashStage = 'bluetooth';
            }
          : undefined}
        onNextClick={() => {
          $connectionDialogState.connectionState = ConnectDialogStates.WEARING_SETUP;
          flashStage = 'radio-sender';
        }} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.START_BLUETOOTH}
      <StartBluetoothDialog
        onStartRadioClick={usb
          ? () => {
              $connectionDialogState.connectionState = ConnectDialogStates.START_RADIO;
              flashStage = 'radio-sender';
            }
          : undefined}
        onNextClick={() =>
          ($connectionDialogState.connectionState = ConnectDialogStates.WEARING_SETUP)} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.WEARING_SETUP}
      {#if flashStage === 'bluetooth'}
        <MicrobitWearingInstructionDialog
          {flashStage}
          onBackClick={() =>
            ($connectionDialogState.connectionState =
              ConnectDialogStates.START_BLUETOOTH)}
          onNextClick={() =>
            ($connectionDialogState.connectionState =
              ConnectDialogStates.CONNECT_CABLE)} />
      {:else if flashStage === 'radio-sender'}
        <MicrobitWearingInstructionDialog
          {flashStage}
          onBackClick={() =>
            ($connectionDialogState.connectionState = ConnectDialogStates.START_RADIO)}
          onNextClick={() =>
            ($connectionDialogState.connectionState =
              ConnectDialogStates.CONNECT_CABLE)} />
      {/if}
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.CONNECT_CABLE}
      {#if flashStage === 'bluetooth'}
        <ConnectCableDialog
          titleId="connectMB.connectCable.heading"
          subtitleId="connectMB.connectCable.subtitle"
          onSkipClick={() =>
            ($connectionDialogState.connectionState =
              ConnectDialogStates.CONNECT_BATTERY)}
          onBackClick={() =>
            ($connectionDialogState.connectionState = ConnectDialogStates.WEARING_SETUP)}
          onNextClick={() =>
            usb
              ? ($connectionDialogState.connectionState =
                  ConnectDialogStates.CONNECT_TUTORIAL_USB)
              : ($connectionDialogState.connectionState =
                  ConnectDialogStates.MANUAL_TUTORIAL)} />
      {:else if flashStage === 'radio-sender'}
        <ConnectCableDialog
          titleId="connectMB.connectCableMB1.heading"
          subtitleId="connectMB.connectCableMB1.subtitle"
          onSkipClick={isDevMode
            ? () => {
                $connectionDialogState.connectionState =
                  ConnectDialogStates.CONNECT_BATTERY;
                flashStage = 'radio-bridge';
              }
            : undefined}
          onBackClick={() =>
            ($connectionDialogState.connectionState = ConnectDialogStates.WEARING_SETUP)}
          onNextClick={() => {
            $connectionDialogState.connectionState =
              ConnectDialogStates.CONNECT_TUTORIAL_USB;
            flashStage = 'radio-sender';
          }} />
      {:else if flashStage === 'radio-bridge'}
        <ConnectCableDialog
          titleId="connectMB.connectCableMB2.heading"
          subtitleId="connectMB.connectCableMB2.subtitle"
          altClickId="connectMB.radioStart.switchBluetooth"
          onAltClick={bluetooth
            ? () => {
                $connectionDialogState.connectionState =
                  ConnectDialogStates.START_BLUETOOTH;
                flashStage = 'bluetooth';
              }
            : undefined}
          onBackClick={() => {
            $connectionDialogState.connectionState = ConnectDialogStates.CONNECT_BATTERY;
            flashStage = 'radio-sender';
          }}
          onNextClick={() =>
            ($connectionDialogState.connectionState =
              ConnectDialogStates.CONNECT_TUTORIAL_USB)} />
      {/if}
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.CONNECT_TUTORIAL_USB}
      <SelectMicrobitDialogUsb
        onBackClick={() =>
          ($connectionDialogState.connectionState = ConnectDialogStates.CONNECT_CABLE)}
        onNextClick={tryMicrobitConnection} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.CONNECT_BATTERY}
      {#if flashStage === 'bluetooth'}
        <ConnectBatteryDialog
          onBackClick={() =>
            usb
              ? ($connectionDialogState.connectionState =
                  ConnectDialogStates.CONNECT_TUTORIAL_USB)
              : ($connectionDialogState.connectionState =
                  ConnectDialogStates.MANUAL_TUTORIAL)}
          onNextClick={() =>
            ($connectionDialogState.connectionState = ConnectDialogStates.BLUETOOTH)} />
      {:else}
        <ConnectBatteryDialog
          onBackClick={() => {
            $connectionDialogState.connectionState =
              ConnectDialogStates.CONNECT_TUTORIAL_USB;
            flashStage = 'radio-sender';
          }}
          onNextClick={() => {
            $connectionDialogState.connectionState = ConnectDialogStates.CONNECT_CABLE;
            flashStage = 'radio-bridge';
          }} />
      {/if}
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.BLUETOOTH}
      <BluetoothConnectDialog
        onBackClick={() => {
          $connectionDialogState.connectionState = ConnectDialogStates.CONNECT_BATTERY;
        }}
        onNextClick={() => {
          $connectionDialogState.connectionState =
            ConnectDialogStates.CONNECT_TUTORIAL_BLUETOOTH;
        }}
        deviceState={$connectionDialogState.deviceState} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.CONNECT_TUTORIAL_BLUETOOTH}
      <SelectMicrobitDialogBluetooth
        onBackClick={() =>
          ($connectionDialogState.connectionState = ConnectDialogStates.BLUETOOTH)}
        onNextClick={onFoundBluetoothDevice} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.BLUETOOTH_CONNECTING}
      <BluetoothConnectingDialog
        onCancel={endFlow}
        onReconnectBluetooth={() =>
          ($connectionDialogState.connectionState = ConnectDialogStates.BLUETOOTH)}
        onBluetoothConnected={endFlow}
        deviceState={$connectionDialogState.deviceState} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.CONNECTING_MICROBITS}
      <ConnectingMicrobits />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.BAD_FIRMWARE}
      <BrokenFirmwareDetected
        {flashStage}
        onSkip={() =>
          ($connectionDialogState.connectionState = ConnectDialogStates.MANUAL_TUTORIAL)}
        onTryAgain={() =>
          ($connectionDialogState.connectionState = ConnectDialogStates.CONNECT_CABLE)}
        onCancel={endFlow} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.USB_DOWNLOADING}
      <DownloadingDialog transferProgress={flashProgress} {flashStage} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.MANUAL_TUTORIAL}
      <ManualInstallTutorial
        onBackClick={() =>
          usb
            ? ($connectionDialogState.connectionState =
                ConnectDialogStates.CONNECT_TUTORIAL_USB)
            : ($connectionDialogState.connectionState =
                ConnectDialogStates.CONNECT_CABLE)}
        onNextClick={() =>
          ($connectionDialogState.connectionState =
            ConnectDialogStates.CONNECT_BATTERY)} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.USB_TRY_AGAIN}
      <WebUsbTryAgain
        type={usbTryAgainType}
        onCancel={endFlow}
        onTryAgain={() => {
          $connectionDialogState.connectionState = ConnectDialogStates.CONNECT_CABLE;
        }} />
    {/if}
  </StandardDialog>
</div>
