<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { ConnectionStates as states } from '../../script/stores/connectDialogStore';
  import MicrobitWearingInstructionDialog from './MicrobitWearingInstructionDialog.svelte';
  import ConnectCableDialog from './bluetooth/ConnectCableDialog.svelte';
  import StartBluetoothDialog from './bluetooth/StartBluetoothDialog.svelte';
  import StartRadioDialog from './radio/StartRadioDialog.svelte';

  export let state: states;
  export let onSwitch: (() => void) | undefined = undefined;
  export let onNext: () => void;
  export let onBack: () => void;
  export let onSkip: (() => void) | undefined = undefined;
</script>

{#if state === states.WHAT_YOU_WILL_NEED_1_MICROBIT}
  <StartRadioDialog onStartBluetoothClick={onSwitch} onNextClick={onNext} />
{:else if state === states.WHAT_YOU_WILL_NEED_2_MICROBITS}
  <StartBluetoothDialog onStartRadioClick={onSwitch} onNextClick={onNext} />
{:else if state === states.SETUP_1_MICROBIT}
  <MicrobitWearingInstructionDialog
    onBackClick={onBack}
    onNextClick={onNext}
    flashStage="bluetooth" />
{:else if state === states.SETUP_2_MICROBITS}
  <MicrobitWearingInstructionDialog
    onBackClick={onBack}
    onNextClick={onNext}
    flashStage="radio-sender" />
{:else if state === states.CONNECT_CABLE_USB}
  <ConnectCableDialog
    titleId="connectMB.connectCable.heading"
    subtitleId="connectMB.connectCable.subtitle"
    onSkipClick={onSkip}
    onBackClick={onBack}
    onNextClick={onNext} />
{:else if state === states.CONNECT_CABLE_USB_RADIO_SENDER}
  <ConnectCableDialog
    titleId="connectMB.connectCableMB1.heading"
    subtitleId="connectMB.connectCableMB1.subtitle"
    onSkipClick={onSkip}
    onBackClick={onBack}
    onNextClick={onNext} />
{:else if state === states.CONNECT_CABLE_USB_RADIO_RECEIVER}
  <ConnectCableDialog
    titleId="connectMB.connectCableMB2.heading"
    subtitleId="connectMB.connectCableMB2.subtitle"
    onAltClick={onSwitch}
    onBackClick={onBack}
    onNextClick={onNext} />
{/if}
