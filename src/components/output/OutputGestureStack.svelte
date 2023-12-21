<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<style>
  input[type='range'] {
    writing-mode: bt-lr;
    appearance: slider-sideways;
    width: 15rem;
  }
</style>

<script lang="ts">
  // IMPORT AND DEFAULTS
  import OutputMatrix from './OutputMatrix.svelte';
  import {
    settings,
    updateGestureSoundOutput,
    type SoundData,
    updateGesturePinOutput,
  } from '../../script/stores/mlStore';
  import { t } from '../../i18n';
  import OutputSoundSelector from './OutputSoundSelector.svelte';
  import Microbits from '../../script/microbit-interfacing/Microbits';
  import ImageSkeleton from '../skeletonloading/ImageSkeleton.svelte';
  import GestureTilePart from '../GestureTilePart.svelte';
  import PinSelector from './PinSelector.svelte';
  import { state } from '../../script/stores/uiStore';
  import StaticConfiguration from '../../StaticConfiguration';
  import Information from '../information/Information.svelte';
  import { PinTurnOnState } from './PinSelectorUtil';
  import MBSpecs from '../../script/microbit-interfacing/MBSpecs';
  import Gesture from '../../script/domain/Gesture';
  import rightArrowImage from '../../imgs/right_arrow.svg';
  import rightArrowBlueImage from '../../imgs/right_arrow_blue.svg';
  import blankMicrobitImage from '../../imgs/blank_microbit.svg';

  type TriggerAction = 'turnOn' | 'turnOff' | 'none';

  // Variables for component
  export let gesture: Gesture;
  export let onUserInteraction: () => void = () => {
    return;
  };
  let wasTriggered = false;
  let triggerFunctions: (() => void)[] = [];
  let selectedSound: SoundData | undefined = $gesture.output.sound;
  let selectedPin: MBSpecs.UsableIOPin = $gesture.output.outputPin
    ? $gesture.output.outputPin.pin
    : StaticConfiguration.defaultOutputPin;

  let pinIOEnabled = StaticConfiguration.pinIOEnabledByDefault;
  let turnOnTime = $gesture.output.outputPin
    ? $gesture.output.outputPin.turnOnTime
    : StaticConfiguration.defaultPinToggleTime;
  let turnOnState = $gesture.output.outputPin
    ? $gesture.output.outputPin.pinState
    : StaticConfiguration.defaultPinTurnOnState;

  // Bool flag that determines the visibility of the output gesture panels
  const enableOutputGestures = false;

  let requiredConfidence = StaticConfiguration.defaultRequiredConfidence;

  const getTriggerAction = (
    lastWasTriggered: boolean,
    confidence: number,
    requiredConfidence: number,
  ): TriggerAction => {
    let isConfident = requiredConfidence <= confidence;
    if ((!lastWasTriggered || !$settings.automaticClassification) && isConfident) {
      return 'turnOn';
    }
    if (lastWasTriggered && !isConfident) {
      return 'turnOff';
    }
    return 'none';
  };

  const wasTurnedOn = () => {
    triggerComponents();
    playSound();
    wasTriggered = true;
  };

  const handleTriggering = (action: TriggerAction) => {
    if (action === 'none') {
      return;
    }
    if (action === 'turnOn') {
      wasTurnedOn();
    } else {
      wasTriggered = false;
    }

    if (!pinIOEnabled) {
      return;
    }
    const shouldTurnPinOn = action === 'turnOn';
    setOutputPin(shouldTurnPinOn);
  };

  $: {
    let triggerAction = getTriggerAction(
      wasTriggered,
      $gesture.confidence.currentConfidence,
      $gesture.confidence.requiredConfidence,
    );
    handleTriggering(triggerAction);
  }

  function setOutputPin(on: boolean) {
    if (!Microbits.isOutputReady()) {
      return;
    }

    const isOnTimer = turnOnState === PinTurnOnState.X_TIME;
    if (on) {
      Microbits.sendToOutputPin([{ pin: selectedPin, on: true }]);
      // If pin is on timer, set timeout to turn off again
      if (isOnTimer) {
        setTimeout(() => {
          Microbits.sendToOutputPin([{ pin: selectedPin, on: false }]);
        }, turnOnTime);
      }
    } else if (!isOnTimer) {
      // else if on === false and the pin is not on a timer, turn it off
      Microbits.sendToOutputPin([{ pin: selectedPin, on: false }]);
    }
  }

  function onSoundSelected(sound: SoundData | undefined): void {
    selectedSound = sound;
    updateGestureSoundOutput($gesture.ID, sound);
    onUserInteraction();
  }

  function playSound() {
    if (selectedSound === undefined) {
      return;
    }
    if (!Microbits.isOutputAssigned()) {
      return;
    }

    if (Microbits.getAssignedOutput().getVersion() === 1) {
      const sound = new Audio(selectedSound.path);
      void sound.play();
    } else {
      void Microbits.sendUARTSoundMessageToOutput(selectedSound.id);
    }
  }

  const onPinSelect = (selected: MBSpecs.UsableIOPin) => {
    if (selected === selectedPin) {
      pinIOEnabled = !pinIOEnabled;
    }
    selectedPin = selected;
    refreshAfterChange();
    updateGesturePinOutput($gesture.ID, selectedPin, turnOnState, turnOnTime);
  };

  const triggerComponents = () =>
    triggerFunctions.forEach(triggerFunc => {
      triggerFunc();
    });

  const onTurnOnTimeSelect = (state: {
    turnOnState: PinTurnOnState;
    turnOnTime: number;
  }) => {
    turnOnState = state.turnOnState;
    turnOnTime = state.turnOnTime;
    refreshAfterChange();
    updateGesturePinOutput($gesture.ID, selectedPin, turnOnState, turnOnTime);
    if (wasTriggered) {
      setOutputPin(true);
    }
  };

  const refreshAfterChange = () => {
    Microbits.resetIOPins();
    setOutputPin(false);
  };

  let sliderValue = requiredConfidence * 100;
  $: {
    gesture.getConfidence().setRequiredConfidence(sliderValue / 100);
  }

  let hasLoadedMicrobitImage = false;

  const meterTotalWidth = 15;

  $: meterWidthPct = 100 * $gesture.confidence.currentConfidence;
</script>

<main class="mb-4 items-center flex flex-row space-x-2">
  <!-- ACTION TITLE -->
  <GestureTilePart elevated={true}>
    <div class="items-center flex p-2 w-60 h-29">
      <div
        class="pr-20 font-semibold rounded
                    px-1 py-1
                    ml-5 break-words text-2xl">
        <h3>{$gesture.name}</h3>
      </div>
    </div></GestureTilePart>

  <GestureTilePart elevated={true}>
    <!-- METER -->
    <div class="w-90 h-13 relative">
      <div class="pt-7 pl-5">
        <div
          class="h-3 rounded-full bg-gray-200 overflow-hidden"
          style="width: {meterTotalWidth}rem">
          <div
            class="absolute h-3 rounded-full {wasTriggered
              ? 'bg-secondary'
              : 'bg-gray-500'}"
            style="width: {meterWidthPct > 5
              ? meterWidthPct * meterTotalWidth * 0.01
              : 1}rem;" />
          <div />
          <div class="relative pl-5 grid grid-cols-8">
            {#each Array(10) as _, index (index)}
              <div class="bg-white w-0.5 h-5" />
            {/each}
          </div>
        </div>
        <p
          class="absolute right-5 top-5 {wasTriggered
            ? 'bg-secondary'
            : 'bg-gray-500'} text-white rounded w-15 text-xl text-center">
          {~~meterWidthPct}%
        </p>
      </div>
    </div>
    <div class="relative self-start">
      <Information
        titleText={$t('content.model.classification.helpHeading')}
        bodyText={$t('content.model.classification.helpBody')}
        isLightTheme={false} />
    </div>
    <!-- RECOGNITION POINT BAR -->
    <div class="pl-5 pb-5">
      <p class="text-sm text-gray-500 pl">
        {$t('content.model.output.recognitionPoint')}
      </p>
      <input
        class="accent-gray-500"
        type="range"
        name=""
        min="10"
        max="90"
        id=""
        bind:value={sliderValue} />
    </div>
  </GestureTilePart>

  {#if enableOutputGestures}
    <!-- ARROW -->
    <div class="text-center w-15">
      <img
        class="m-auto"
        class:hidden={wasTriggered}
        src={rightArrowImage}
        alt="right arrow icon"
        width="30px" />
      <img
        class="m-auto"
        class:hidden={!wasTriggered || !$state.isInputReady}
        src={rightArrowBlueImage}
        alt="right arrow icon"
        width="30px" />
    </div>

    <!-- OUTPUT SETTINGS -->
    <div class="relative flex items-center">
      <div
        class="w-177px relative rounded-xl bg-transparent h-full border-1 border-primaryborder">
        <ImageSkeleton
          src={blankMicrobitImage}
          alt="microbit guide"
          width={177}
          height={144}
          loadingColorSecondary="#818181"
          loadingColorPrimary="#4A4A4A"
          onLoaded={() => (hasLoadedMicrobitImage = true)} />
        <div
          class="bg-black p-0 m-0 absolute top-9 left-12.7"
          class:hidden={!hasLoadedMicrobitImage}
          on:click={onUserInteraction}>
          <OutputMatrix bind:trigger={triggerFunctions[0]} gesture={$gesture} />
        </div>
      </div>
      <OutputSoundSelector onSoundSelection={onSoundSelected} {selectedSound} />
    </div>
    <div class="ml-4">
      <PinSelector
        selectedPin={pinIOEnabled ? selectedPin : undefined}
        {turnOnState}
        {turnOnTime}
        {onPinSelect}
        {onTurnOnTimeSelect} />
    </div>
  {/if}
</main>
