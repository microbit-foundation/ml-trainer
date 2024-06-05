<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { Unsubscriber, get } from 'svelte/store';
  import { isDevMode } from '../../script/environment';
  import { flags } from '../../script/flags';
  import MBSpecs from '../../script/microbit-interfacing/MBSpecs';
  import MicrobitUSB from '../../script/microbit-interfacing/MicrobitUSB';
  import Microbits, {
    FlashStage,
    HexType,
    getHexFileUrl,
    getHexStrForVersion,
  } from '../../script/microbit-interfacing/Microbits';
  import {
    ConnectDialogStates,
    connectionDialogState,
  } from '../../script/stores/connectDialogStore';
  import {
    btPatternInput,
    radioBridgeRemoteDeviceId,
  } from '../../script/stores/connectionStore';
  import { compatibility, state } from '../../script/stores/uiStore';
  import StandardDialog from '../dialogs/StandardDialog.svelte';
  import WebBluetoothTryAgain from './WebBluetoothTryAgain.svelte';
  import WebUsbTryAgain, { USBTryAgainType } from './WebUsbTryAgain.svelte';
  import BluetoothConnectDialog from './bluetooth/BluetoothConnectDialog.svelte';
  import BluetoothConnectingDialog from './bluetooth/BluetoothConnectingDialog.svelte';
  import ConnectBatteryDialog from './bluetooth/ConnectBatteryDialog.svelte';
  import ConnectCableDialog from './bluetooth/ConnectCableDialog.svelte';
  import SelectMicrobitDialogBluetooth from './bluetooth/SelectMicrobitDialogBluetooth.svelte';
  import StartBluetoothDialog from './bluetooth/StartBluetoothDialog.svelte';
  import ConnectingMicrobits from './radio/ConnectingMicrobits.svelte';
  import StartRadioDialog from './radio/StartRadioDialog.svelte';
  import BrokenFirmwareDetected from './usb/BrokenFirmwareDetected.svelte';
  import DownloadingDialog from './usb/DownloadingDialog.svelte';
  import SelectMicrobitDialogUsb from './usb/SelectMicrobitDialogUsb.svelte';
  import ManualInstallTutorial from './usb/manual/ManualInstallTutorial.svelte';
  import UnsupportedMicrobitWarningDialog from '../dialogs/UnsupportedMicrobitWarningDialog.svelte';
  import ConnectSameDialog from './ConnectSameDialog.svelte';
  import InputNotConnectedDialog from './InputNotConnectedDialog.svelte';
  import { DeviceRequestStates } from '../../script/microbit-interfacing/MicrobitConnection';

  const { bluetooth, usb } = get(compatibility);
  let endOfFlow = false;
  let flashStage: FlashStage = usb ? 'bluetooth' : 'radio-remote';
  let usbTryAgainType: USBTryAgainType = 'replug microbit';
  let flashProgress = 0;

  const stageToHex = (flashStage: FlashStage): HexType => {
    if (flashStage === 'bluetooth') {
      return 'bluetooth';
    }
    if (flags.radioLocal) {
      return 'radio-local';
    }
    if (flashStage === 'radio-remote') {
      return flags.radioRemoteDev ? 'radio-remote-dev' : 'radio-remote';
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

  async function tryMicrobitUSBConnection(): Promise<void> {
    $connectionDialogState.connectionState = ConnectDialogStates.BROWSER_DIALOG;
    let usb: MicrobitUSB | undefined;
    try {
      usb = await MicrobitUSB.requestConnection();
    } catch (err) {
      return handleConnectionError(err);
    }
    return flashMicrobit(usb);
  }

  const getInputHexBuffer = async (
    usb: MicrobitUSB,
  ): Promise<ArrayBuffer | undefined> => {
    const hexForStage = stageToHex(flashStage);
    const hexUrl = getHexFileUrl(usb.getModelNumber(), hexForStage);
    if (hexUrl === undefined) {
      return;
    }
    const hexFile = await fetch(hexUrl);
    return hexFile.arrayBuffer();
  };

  const getOutputHexBuffer = (usb: MicrobitUSB): ArrayBuffer | undefined => {
    if (!$state.outputHex) {
      // TODO: Handle scenario for hex data downloaded from MakeCode is invalid
      return;
    }
    const hexStr = getHexStrForVersion($state.outputHex, usb.getModelNumber());
    return new TextEncoder().encode(hexStr);
  };

  async function flashMicrobit(usb: MicrobitUSB): Promise<void> {
    try {
      const deviceId = await usb.getDeviceId();

      const hexBuffer =
        $connectionDialogState.deviceState == DeviceRequestStates.OUTPUT
          ? getOutputHexBuffer(usb)
          : await getInputHexBuffer(usb);

      if (hexBuffer === undefined) {
        $connectionDialogState.connectionState = ConnectDialogStates.MICROBIT_UNSUPPORTED;
        return;
      }

      await usb.flashHex(hexBuffer, progress => {
        // Flash hex
        // Send users to download screen
        if (
          $connectionDialogState.connectionState != ConnectDialogStates.USB_DOWNLOADING
        ) {
          $connectionDialogState.connectionState = ConnectDialogStates.USB_DOWNLOADING;
        }
        flashProgress = progress;
      });

      // Store radio/bluetooth details. Radio is essential to pass to micro:bit 2.
      // Bluetooth saves the user from entering the pattern.
      if (flashStage === 'bluetooth') {
        $btPatternInput = MBSpecs.Utility.nameToPattern(
          MBSpecs.Utility.serialNumberToName(deviceId),
        );
      }
      if (flashStage === 'radio-remote') {
        $radioBridgeRemoteDeviceId = deviceId;
      }

      // Next UI state:
      if (flashStage === 'bluetooth' || flashStage === 'radio-remote') {
        $connectionDialogState.connectionState = ConnectDialogStates.CONNECT_BATTERY;
      } else if (flashStage === 'radio-bridge') {
        onConnectingSerial(usb);
      }
    } catch (err) {
      console.error(err);
      handleConnectionError(err);
    }
  }

  const tryMicrobitBluetoothConnection = async () => {
    $connectionDialogState.connectionState = ConnectDialogStates.BLUETOOTH_CONNECTING;
    try {
      const success = await Microbits.assignBluetoothInput(
        MBSpecs.Utility.patternToName($btPatternInput),
      );
      if (success) {
        endFlow();
      } else {
        $connectionDialogState.connectionState = ConnectDialogStates.BLUETOOTH_TRY_AGAIN;
      }
    } catch (e) {
      $connectionDialogState.connectionState = ConnectDialogStates.BLUETOOTH_TRY_AGAIN;
    }
  };

  async function onConnectingSerial(usb: MicrobitUSB): Promise<void> {
    $connectionDialogState.connectionState = ConnectDialogStates.CONNECTING_MICROBITS;
    if ($radioBridgeRemoteDeviceId === -1) {
      throw new Error('Radio bridge device id not set');
    }
    await Microbits.assignSerialInput(usb, $radioBridgeRemoteDeviceId);
    endFlow();
  }

  function connectionStateNone() {
    setTimeout(() => {
      $connectionDialogState.connectionState = ConnectDialogStates.NONE;
      // If the user closes the dialog while it shows information relating
      // to reconnection failure reset state to starting conditions.
      $state.reconnectState = { ...$state.reconnectState, reconnectFailed: false };
      endOfFlow = false;
    }, 200);
  }

  function endFlow() {
    endOfFlow = true;
    connectionStateNone();
  }

  let dialogContainer: HTMLElement;
  let unsubscribe: Unsubscriber;
  $: isOutputMicrobit = $connectionDialogState.deviceState === DeviceRequestStates.OUTPUT;

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
    hideContent={$connectionDialogState.connectionState ===
      ConnectDialogStates.BROWSER_DIALOG}
    isOpen={$connectionDialogState.connectionState !== ConnectDialogStates.NONE &&
      !endOfFlow}
    onClose={connectionStateNone}
    hasCloseButton={$connectionDialogState.connectionState !==
      ConnectDialogStates.USB_DOWNLOADING &&
      $connectionDialogState.connectionState !== ConnectDialogStates.BLUETOOTH_CONNECTING}
    closeOnOutsideClick={false}
    closeOnEscape={$connectionDialogState.connectionState !==
      ConnectDialogStates.USB_DOWNLOADING &&
      $connectionDialogState.connectionState !==
        ConnectDialogStates.BLUETOOTH_CONNECTING}>
    {#if $connectionDialogState.connectionState === ConnectDialogStates.START_OUTPUT}
      <ConnectSameDialog
        onConnectSameClick={() => {
          // TODO: Connect same micro:bit as output flow
        }}
        onConnectDifferentClick={() =>
          ($connectionDialogState.connectionState =
            ConnectDialogStates.START_BLUETOOTH)} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.INPUT_NOT_CONNECTED}
      <InputNotConnectedDialog
        onConnectInput={() => {
          $connectionDialogState.connectionState = ConnectDialogStates.START_BLUETOOTH;
          flashStage = 'bluetooth';
        }}
        onCancel={endFlow} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.START_RADIO}
      <StartRadioDialog
        onStartBluetoothClick={bluetooth
          ? () => {
              $connectionDialogState.connectionState =
                ConnectDialogStates.START_BLUETOOTH;
              flashStage = 'bluetooth';
            }
          : undefined}
        onNextClick={() => {
          $connectionDialogState.connectionState = ConnectDialogStates.CONNECT_CABLE;
          flashStage = 'radio-remote';
        }} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.START_BLUETOOTH}
      <StartBluetoothDialog
        onStartRadioClick={usb && !isOutputMicrobit
          ? () => {
              $connectionDialogState.connectionState = ConnectDialogStates.START_RADIO;
              flashStage = 'radio-remote';
            }
          : undefined}
        onNextClick={() =>
          ($connectionDialogState.connectionState = ConnectDialogStates.CONNECT_CABLE)}
        onBackClick={isOutputMicrobit
          ? () => {
              $connectionDialogState.connectionState = ConnectDialogStates.START_OUTPUT;
            }
          : undefined} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.CONNECT_CABLE}
      {#if flashStage === 'bluetooth'}
        <ConnectCableDialog
          titleId="connectMB.connectCable.heading"
          subtitleId={isOutputMicrobit
            ? 'connectMB.connectCable.output.subtitle'
            : 'connectMB.connectCable.subtitle'}
          onSkipClick={isOutputMicrobit
            ? undefined
            : () =>
                ($connectionDialogState.connectionState =
                  ConnectDialogStates.CONNECT_BATTERY)}
          onBackClick={() =>
            ($connectionDialogState.connectionState =
              ConnectDialogStates.START_BLUETOOTH)}
          onNextClick={() =>
            usb
              ? ($connectionDialogState.connectionState =
                  ConnectDialogStates.CONNECT_TUTORIAL_USB)
              : ($connectionDialogState.connectionState =
                  ConnectDialogStates.MANUAL_TUTORIAL)} />
      {:else if flashStage === 'radio-remote'}
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
            ($connectionDialogState.connectionState = ConnectDialogStates.START_RADIO)}
          onNextClick={() => {
            $connectionDialogState.connectionState =
              ConnectDialogStates.CONNECT_TUTORIAL_USB;
            flashStage = 'radio-remote';
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
            flashStage = 'radio-remote';
          }}
          onNextClick={() =>
            ($connectionDialogState.connectionState =
              ConnectDialogStates.CONNECT_TUTORIAL_USB)} />
      {/if}
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.CONNECT_TUTORIAL_USB}
      <SelectMicrobitDialogUsb
        onBackClick={() =>
          ($connectionDialogState.connectionState = ConnectDialogStates.CONNECT_CABLE)}
        onNextClick={tryMicrobitUSBConnection} />
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
            flashStage = 'radio-remote';
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
        onNextClick={tryMicrobitBluetoothConnection} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.BLUETOOTH_CONNECTING}
      <BluetoothConnectingDialog />
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
          ($connectionDialogState.connectionState = ConnectDialogStates.CONNECT_BATTERY)}
        deviceState={$connectionDialogState.deviceState} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.USB_TRY_AGAIN}
      <WebUsbTryAgain
        type={usbTryAgainType}
        onCancel={endFlow}
        onTryAgain={() => {
          $connectionDialogState.connectionState = ConnectDialogStates.CONNECT_CABLE;
        }} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.BLUETOOTH_TRY_AGAIN}
      <WebBluetoothTryAgain
        onCancel={endFlow}
        onTryAgain={() => {
          $connectionDialogState.connectionState = ConnectDialogStates.BLUETOOTH;
        }} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.MICROBIT_UNSUPPORTED}
      <UnsupportedMicrobitWarningDialog
        onStartBluetoothClick={() => {
          $connectionDialogState.connectionState = ConnectDialogStates.START_BLUETOOTH;
        }}
        onClose={endFlow} />
    {/if}
  </StandardDialog>
</div>
