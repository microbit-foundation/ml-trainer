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
  import DoneDownloadingDialog from './usb/DoneDownloadingDialog.svelte';
  import DownloadingDialog from './usb/DownloadingDialog.svelte';
  import FindUsbDialog from './usb/FindUsbDialog.svelte';
  import ManualInstallTutorial from './usb/manual/ManualInstallTutorial.svelte';
  import {
    ConnectDialogStates,
    connectionDialogState,
    DeviceRequestStates,
  } from '../../script/stores/connectDialogStore';
  import Microbits from '../../script/microbit-interfacing/Microbits';
  import { btPatternInput, btPatternOutput } from '../../script/stores/connectionStore';
  import MBSpecs from '../../script/microbit-interfacing/MBSpecs';
  import BrokenFirmwareDetected from './usb/BrokenFirmwareDetected.svelte';
  import BluetoothConnectingDialog from './bluetooth/BluetoothConnectingDialog.svelte';
  import SelectMicrobitDialogBluetooth from './bluetooth/SelectMicrobitDialogBluetooth.svelte';
  import MicrobitSerial from '../../script/microbit-interfacing/MicrobitSerial';
  import MicrobitWearingInstructionDialog from './MicrobitWearingInstructionDialog.svelte';
  import WebUsbTryAgain from './WebUsbTryAgain.svelte';

  let endOfFlow = false;
  let currentStage: 'usb' | 'usb1' | 'usb2' = 'usb1'; // "usb" is for the bluetooth connection flow, "usb1" and "usb2" determine the progress in the radio connection flow
  let reconnectRequired = false;
  let flashProgress = 0;

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

          break;
        } else {
          // Unhandled error. User will need to reconnect their micro:bit
          $connectionDialogState.connectionState = ConnectDialogStates.USB_TRY_AGAIN;
          reconnectRequired = true;
          break;
        }
      default: {
        $connectionDialogState.connectionState = ConnectDialogStates.USB_TRY_AGAIN;
        reconnectRequired = true;
      }
    }
  };

  function onFoundUsbDevice() {
    Microbits.getLinkedFriendlyName()
      .then(friendlyName => {
        // Find the name of the micro:bit
        if ($connectionDialogState.deviceState === DeviceRequestStates.OUTPUT) {
          btPatternOutput.set(MBSpecs.Utility.nameToPattern(friendlyName));
        } else {
          btPatternInput.set(MBSpecs.Utility.nameToPattern(friendlyName));
        }

        // radio-local is a temporary debug hack
        const hexForStage = currentStage === 'usb' ? 'bluetooth' : 'radio-local';
        Microbits.flashHexToLinked(hexForStage, progress => {
          // Flash hex
          // Send users to download screen
          if (
            $connectionDialogState.connectionState != ConnectDialogStates.USB_DOWNLOADING
          ) {
            $connectionDialogState.connectionState = ConnectDialogStates.USB_DOWNLOADING;
          }
          flashProgress = progress;
        })
          .then(() => {
            // Finished flashing successfully
            if (currentStage === 'usb' || currentStage === 'usb1') {
              $connectionDialogState.connectionState =
                ConnectDialogStates.CONNECT_BATTERY;
            } else if (currentStage === 'usb2') {
              onConnectingSerial();
            }
          })
          .catch(err => {
            if (currentStage === 'usb') {
              $connectionDialogState.connectionState =
                ConnectDialogStates.MANUAL_TUTORIAL;
            } else {
              handleWebUSBError(err);
            }
          });
      })
      .catch(err => {
        if (currentStage === 'usb') {
          $connectionDialogState.connectionState = ConnectDialogStates.MANUAL_TUTORIAL;
        } else {
          handleWebUSBError(err);
        }
      });
  }

  function onFoundBluetoothDevice(): void {
    $connectionDialogState.connectionState = ConnectDialogStates.BLUETOOTH_CONNECTING;
  }

  function onConnectingSerial(): void {
    endFlow();
    Microbits.assignSerialInput('aname');
    // MicrobitSerial.connect(Microbits.getLinked()).catch(() => {
    //   // Errors to consider: microbit is disconnected, some sort of connection error
    // });
  }

  function connectionStateNone() {
    setTimeout(() => {
      $connectionDialogState.connectionState = ConnectDialogStates.NONE;
      endOfFlow = false;
      reconnectRequired = false;
    }, 200);
  }

  function endFlow() {
    endOfFlow = true;
    connectionStateNone();
  }

  let dialogContainer: HTMLElement;

  // Focus the first button in the dialog when the content changes.
  connectionDialogState.subscribe(({ connectionState }) => {
    if (connectionState !== ConnectDialogStates.NONE && !endOfFlow) {
      const button = dialogContainer.querySelector('button');
      if (button) {
        button.focus();
      }
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
    dismissOnClickOutside={false}>
    {#if $connectionDialogState.connectionState === ConnectDialogStates.START_RADIO}
      <StartRadioDialog
        onStartBluetoothClick={() => {
          $connectionDialogState.connectionState = ConnectDialogStates.START_BLUETOOTH;
          currentStage = 'usb';
        }}
        onNextClick={() => {
          $connectionDialogState.connectionState = ConnectDialogStates.WEARING_SETUP;
          currentStage = 'usb1';
        }} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.START_BLUETOOTH}
      <StartBluetoothDialog
        onStartRadioClick={() => {
          $connectionDialogState.connectionState = ConnectDialogStates.START_RADIO;
          currentStage = 'usb1';
        }}
        onNextClick={() =>
          ($connectionDialogState.connectionState = ConnectDialogStates.WEARING_SETUP)} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.WEARING_SETUP}
      {#if currentStage === 'usb'}
        <MicrobitWearingInstructionDialog
          {currentStage}
          onBackClick={() =>
            ($connectionDialogState.connectionState =
              ConnectDialogStates.START_BLUETOOTH)}
          onNextClick={() =>
            ($connectionDialogState.connectionState =
              ConnectDialogStates.CONNECT_CABLE)} />
      {:else if currentStage === 'usb1'}
        <MicrobitWearingInstructionDialog
          {currentStage}
          onBackClick={() =>
            ($connectionDialogState.connectionState = ConnectDialogStates.START_RADIO)}
          onNextClick={() =>
            ($connectionDialogState.connectionState =
              ConnectDialogStates.CONNECT_CABLE)} />
      {/if}
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.CONNECT_CABLE}
      {#if currentStage === 'usb'}
        <ConnectCableDialog
          {currentStage}
          onAltOrSkipClick={() =>
            ($connectionDialogState.connectionState =
              ConnectDialogStates.CONNECT_BATTERY)}
          onBackClick={() =>
            ($connectionDialogState.connectionState = ConnectDialogStates.WEARING_SETUP)}
          onNextClick={() =>
            ($connectionDialogState.connectionState =
              ConnectDialogStates.CONNECT_TUTORIAL_USB)} />
      {:else if currentStage === 'usb1'}
        <ConnectCableDialog
          {currentStage}
          onAltOrSkipClick={() => {
            $connectionDialogState.connectionState = ConnectDialogStates.CONNECT_BATTERY;
            currentStage = 'usb2';
          }}
          onBackClick={() =>
            ($connectionDialogState.connectionState = ConnectDialogStates.WEARING_SETUP)}
          onNextClick={() => {
            $connectionDialogState.connectionState =
              ConnectDialogStates.CONNECT_TUTORIAL_USB;
            currentStage = 'usb1';
          }} />
      {:else if currentStage === 'usb2'}
        <ConnectCableDialog
          {currentStage}
          onAltOrSkipClick={() => {
            $connectionDialogState.connectionState = ConnectDialogStates.START_BLUETOOTH;
            currentStage = 'usb';
          }}
          onBackClick={() => {
            $connectionDialogState.connectionState = ConnectDialogStates.CONNECT_BATTERY;
            currentStage = 'usb1';
          }}
          onNextClick={() =>
            ($connectionDialogState.connectionState =
              ConnectDialogStates.CONNECT_TUTORIAL_USB)} />
      {/if}
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.CONNECT_TUTORIAL_USB}
      <SelectMicrobitDialogUsb
        onBackClick={() =>
          ($connectionDialogState.connectionState = ConnectDialogStates.CONNECT_CABLE)}
        onLinkError={() => {
          if (currentStage === 'usb') {
            $connectionDialogState.connectionState = ConnectDialogStates.MANUAL_TUTORIAL;
          } else {
            $connectionDialogState.connectionState = ConnectDialogStates.USB_TRY_AGAIN;
          }
        }}
        onFound={onFoundUsbDevice} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.CONNECT_BATTERY}
      {#if currentStage === 'usb'}
        <ConnectBatteryDialog
          onBackClick={() =>
            ($connectionDialogState.connectionState =
              ConnectDialogStates.CONNECT_TUTORIAL_USB)}
          onNextClick={() =>
            ($connectionDialogState.connectionState = ConnectDialogStates.BLUETOOTH)} />
      {:else}
        <ConnectBatteryDialog
          onBackClick={() => {
            $connectionDialogState.connectionState =
              ConnectDialogStates.CONNECT_TUTORIAL_USB;
            currentStage = 'usb1';
          }}
          onNextClick={() => {
            $connectionDialogState.connectionState = ConnectDialogStates.CONNECT_CABLE;
            currentStage = 'usb2';
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
      CONNECTING_MICROBITS
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.USB_START}
      <FindUsbDialog
        onUsbLinkError={() => {
          $connectionDialogState.connectionState = ConnectDialogStates.MANUAL_TUTORIAL;
        }}
        onFoundUsb={onFoundUsbDevice} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.BAD_FIRMWARE}
      <BrokenFirmwareDetected
        {currentStage}
        onSkip={() =>
          ($connectionDialogState.connectionState = ConnectDialogStates.MANUAL_TUTORIAL)}
        onTryAgain={() =>
          ($connectionDialogState.connectionState = ConnectDialogStates.CONNECT_CABLE)}
        onCancel={endFlow} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.USB_DOWNLOADING}
      <DownloadingDialog transferProgress={flashProgress} {currentStage} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.USB_DONE}
      <DoneDownloadingDialog
        onConnectBluetoothClick={() =>
          ($connectionDialogState.connectionState = ConnectDialogStates.BLUETOOTH)} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.MANUAL_TUTORIAL}
      <ManualInstallTutorial
        onBackClick={() => {
          $connectionDialogState.connectionState =
            ConnectDialogStates.CONNECT_TUTORIAL_USB;
        }}
        onNextClick={() =>
          ($connectionDialogState.connectionState =
            ConnectDialogStates.CONNECT_BATTERY)} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.USB_TRY_AGAIN}
      <WebUsbTryAgain
        {reconnectRequired}
        onCancel={endFlow}
        onTryAgain={() => {
          $connectionDialogState.connectionState = ConnectDialogStates.CONNECT_CABLE;
          reconnectRequired = false;
        }} />
    {/if}
  </StandardDialog>
</div>
