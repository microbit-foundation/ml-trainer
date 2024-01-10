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

  let endOfFlow = false;
  let currentStage: 'usb' | 'usb1' | 'usb2' = 'usb1'; // "usb" is for the bluetooth connection flow, "usb1" and "usb2" determine the progress in the radio connection flow

  let flashProgress = 0;

  function onFoundUsbDevice() {
    Microbits.getLinkedFriendlyName()
      .then(friendlyName => {
        // Find the name of the micro:bit
        if ($connectionDialogState.deviceState === DeviceRequestStates.OUTPUT) {
          btPatternOutput.set(MBSpecs.Utility.nameToPattern(friendlyName));
        } else {
          btPatternInput.set(MBSpecs.Utility.nameToPattern(friendlyName));
        }

        Microbits.flashHexToLinked(progress => {
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
          .catch(() => {
            // Error during flashing process
            $connectionDialogState.connectionState = ConnectDialogStates.MANUAL_TUTORIAL;
          });
      })
      .catch((e: Error) => {
        // Couldn't find name. Set to manual transfer progress instead
        if (e.message.includes('No valid interfaces found')) {
          // Edge case, caused by a bad micro:bit firmware
          $connectionDialogState.connectionState = ConnectDialogStates.BAD_FIRMWARE;
        } else {
          $connectionDialogState.connectionState = ConnectDialogStates.MANUAL_TUTORIAL;
        }
      });
  }

  function onFoundBluetoothDevice(): void {
    $connectionDialogState.connectionState = ConnectDialogStates.BLUETOOTH_CONNECTING;
  }

  function onConnectingSerial(): void {
    endFlow();
    MicrobitSerial.connect(Microbits.getLinked()).catch(() => {
      // Errors to consider: microbit is disconnected, some sort of connection error
    });
  }

  function connectSame() {
    Microbits.useInputAsOutput();
    $connectionDialogState.connectionState = ConnectDialogStates.NONE;
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
</script>

<main>
  <StandardDialog
    isOpen={$connectionDialogState.connectionState !== ConnectDialogStates.NONE &&
      !endOfFlow}
    onClose={connectionStateNone}
    dismissOnClickOutside={false}>
    <BluetoothConnectingDialog
      onBluetoothConnected={endFlow}
      deviceState={$connectionDialogState.deviceState} />
  </StandardDialog>
</main>
