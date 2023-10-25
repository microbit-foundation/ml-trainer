<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardDialog from '../dialogs/StandardDialog.svelte';
  import BluetoothConnectDialog from './bluetooth/BluetoothConnectDialog.svelte';
  import StartDialog from './StartDialog.svelte';
  import DoneDownloadingDialog from './usb/DoneDownloadingDialog.svelte';
  import DownloadingDialog from './usb/DownloadingDialog.svelte';
  import FindUsbDialog from './usb/FindUsbDialog.svelte';
  import ManualInstallTutorial from './usb/manual/ManualInstallTutorial.svelte';
  import {
    ConnectDialogStates,
    connectionDialogState,
    DeviceRequestStates,
  } from '../../script/stores/connectDialogStore';
  import ConnectSameDialog from './ConnectSameDialog.svelte';
  import Microbits from '../../script/microbit-interfacing/Microbits';
  import { btPatternInput, btPatternOutput } from '../../script/stores/connectionStore';
  import MBSpecs from '../../script/microbit-interfacing/MBSpecs';
  import BrokenFirmwareDetected from './usb/BrokenFirmwareDetected.svelte';
    import StandardButton from '../StandardButton.svelte';
    import MicrobitSerial from '../../script/microbit-interfacing/MicrobitSerial';

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
            $connectionDialogState.connectionState = ConnectDialogStates.USB_DONE;
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

  function connectSame() {
    Microbits.useInputAsOutput();
    $connectionDialogState.connectionState = ConnectDialogStates.NONE;
  }
</script>

<main>
  <StandardDialog
    isOpen={$connectionDialogState.connectionState !== ConnectDialogStates.NONE}
    onClose={() => ($connectionDialogState.connectionState = ConnectDialogStates.NONE)}>
    {#if $connectionDialogState.connectionState === ConnectDialogStates.START}
      <StartDialog
        onStartBluetoothClick={() =>
          ($connectionDialogState.connectionState = ConnectDialogStates.BLUETOOTH)}
        onStartUsbClick={() =>
          ($connectionDialogState.connectionState = ConnectDialogStates.USB_START)} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.SERIAL_START}
      <StandardButton onClick={MicrobitSerial.connect}>{'Connect it'}</StandardButton>
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.START_OUTPUT}
      <ConnectSameDialog
        onConnectSameClick={connectSame}
        onConnectDifferentClick={() =>
          ($connectionDialogState.connectionState = ConnectDialogStates.START)} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.BLUETOOTH}
      <BluetoothConnectDialog
        onBluetoothConnected={() => {
          $connectionDialogState.connectionState = ConnectDialogStates.NONE;
        }}
        deviceState={$connectionDialogState.deviceState} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.USB_START}
      <FindUsbDialog
        onUsbLinkError={() => {
          $connectionDialogState.connectionState = ConnectDialogStates.MANUAL_TUTORIAL;
        }}
        onFoundUsb={onFoundUsbDevice} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.BAD_FIRMWARE}
      <BrokenFirmwareDetected />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.USB_DOWNLOADING}
      <DownloadingDialog transferProgress={flashProgress} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.USB_DONE}
      <DoneDownloadingDialog
        onConnectBluetoothClick={() =>
          ($connectionDialogState.connectionState = ConnectDialogStates.BLUETOOTH)} />
    {:else if $connectionDialogState.connectionState === ConnectDialogStates.MANUAL_TUTORIAL}
      <ManualInstallTutorial
        onConnectBluetoothClick={() =>
          ($connectionDialogState.connectionState = ConnectDialogStates.BLUETOOTH)} />
    {/if}
  </StandardDialog>
</main>
