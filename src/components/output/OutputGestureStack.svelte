<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  // IMPORT AND DEFAULTS
  import { MakeCodeProject } from '@microbit-foundation/react-editor-embed';
  import { onMount } from 'svelte';
  import RightArrowIcon from 'virtual:icons/ri/arrow-right-line';
  import StaticConfiguration from '../../StaticConfiguration';
  import { t } from '../../i18n';
  import blankMicrobitImage from '../../imgs/blank_microbit.svg';
  import rightArrowImage from '../../imgs/right_arrow.svg';
  import rightArrowBlueImage from '../../imgs/right_arrow_blue.svg';
  import Gesture from '../../script/domain/Gesture';
  import {
    generateMakeCodeOutputMain,
    getMakeCodeGestureConfig,
  } from '../../script/makecode/generateMain';
  import { filenames } from '../../script/makecode/utils';
  import MBSpecs from '../../script/microbit-interfacing/MBSpecs';
  import Microbits from '../../script/microbit-interfacing/Microbits';
  import {
    settings,
    updateGesturePinOutput,
    updateGestureSoundOutput,
    type SoundData,
  } from '../../script/stores/mlStore';
  import { state } from '../../script/stores/uiStore';
  import CodeView from '../CodeView.svelte';
  import GestureTilePart from '../GestureTilePart.svelte';
  import ImageSkeleton from '../skeletonloading/ImageSkeleton.svelte';
  import LedMatrix from './LedMatrix.svelte';
  import OutputSoundSelector from './OutputSoundSelector.svelte';
  import PinSelector from './PinSelector.svelte';
  import { PinTurnOnState } from './PinSelectorUtil';

  type TriggerAction = 'turnOn' | 'turnOff' | 'none';

  // Variables for component
  export let gesture: Gesture;
  export let project: MakeCodeProject;
  export let onUserInteraction: () => void = () => {
    return;
  };
  export let showOutput: boolean = true;

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
    let isConfident = requiredConfidence <= Number(confidence.toFixed(2));
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
    if (!$state.isOutputReady) {
      return;
    }

    const isOnTimer = turnOnState === PinTurnOnState.X_TIME;
    if (on) {
      Microbits.getOutputMicrobit()?.setPin(selectedPin, true);
      // If pin is on timer, set timeout to turn off again
      if (isOnTimer) {
        setTimeout(() => {
          Microbits.getOutputMicrobit()?.setPin(selectedPin, false);
        }, turnOnTime);
      }
    } else if (!isOnTimer) {
      // else if on === false and the pin is not on a timer, turn it off
      Microbits.getOutputMicrobit()?.setPin(selectedPin, on);
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
    if (!Microbits.getOutputMicrobit()) {
      return;
    }

    if ($state.outputMicrobitVersion === 1) {
      const sound = new Audio(selectedSound.path);
      void sound.play();
    } else {
      Microbits.getOutputMicrobit()?.sendToOutputUart('s', selectedSound.id);
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
    Microbits.getOutputMicrobit()?.resetPins();
    setOutputPin(false);
  };

  let sliderValue = requiredConfidence * 100;
  let slider: HTMLInputElement;
  onMount(() => {
    slider.addEventListener('input', () => {
      if (Number(slider.value) < 10) {
        sliderValue = 10;
      }
      if (Number(slider.value) > 90) {
        sliderValue = 90;
      }
    });
  });
  $: {
    gesture.getConfidence().setRequiredConfidence(sliderValue / 100);
  }

  let hasLoadedMicrobitImage = false;

  $: meterWidthPct = 100 * $gesture.confidence.currentConfidence;

  const gestureProject = {
    text: {
      ...project.text,
      [filenames.mainTs]: generateMakeCodeOutputMain([gesture], 'javascript'),
      [filenames.mainBlocks]: generateMakeCodeOutputMain([gesture], 'blocks'),
    },
  };
</script>

<!-- ACTION TITLE -->
<GestureTilePart small elevated={true}>
  <div class="flex items-center justify-center w-full h-full relative gap-5 px-2">
    <div class="flex items-center gap-1">
      <LedMatrix
        class="w-22 h-22"
        mode="input"
        editable={false}
        gesture={$gesture}
        variant={wasTriggered ? 'highlighted' : 'muted'} />
    </div>
    <h3 class="w-full break-words truncate text-2xl">{$gesture.name}</h3>
  </div>
</GestureTilePart>

<GestureTilePart elevated={true} class="relative">
  <!-- METER -->
  <div class="w-90 p-5 space-y-1">
    <div class="flex items-center gap-x-5">
      <div class="h-3 relative flex-grow rounded-full bg-gray-200 overflow-hidden">
        <div
          class="h-3 rounded-r-full {wasTriggered ? 'bg-secondary' : 'bg-gray-500'}"
          style="width: {Math.round(meterWidthPct)}%" />
        <div class="absolute flex justify-evenly top-0 left-0 right-0 z-1">
          {#each Array(9) as _, index (index)}
            <div class="bg-white w-0.5 h-3" />
          {/each}
        </div>
      </div>
      <p
        class="{wasTriggered
          ? 'bg-secondary'
          : 'bg-gray-500'} text-white rounded w-15 text-xl text-center">
        {Math.round(meterWidthPct)}%
      </p>
    </div>
    <!-- RECOGNITION POINT BAR -->
    <p class="text-sm text-gray-500">
      {$t('content.model.output.recognitionPoint')}
    </p>
    <input
      class="accent-gray-500 w-60 outline-none focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:ring-ring"
      type="range"
      min="0"
      max="100"
      bind:value={sliderValue}
      bind:this={slider} />
  </div>
  {#if enableOutputGestures}
    <!-- ARROW -->
    <div class="text-center absolute -right-30px top-1/2 translate-y-1/3">
      <img
        class:hidden={wasTriggered}
        src={rightArrowImage}
        alt={$t('arrowIconRight.altText')}
        width={30} />
      <img
        class:hidden={!wasTriggered || !$state.isInputReady}
        src={rightArrowBlueImage}
        alt={$t('arrowIconRight.altText')}
        width={30} />
    </div>
  {/if}
</GestureTilePart>

<!-- ARROW -->
<GestureTilePart class="relative bg-transparent">
  <div class="flex flex-col justify-center items-center h-full">
    <RightArrowIcon class="text-4xl text-gray-500" aria-hidden />
  </div>
</GestureTilePart>

<!-- MAKECODE -->
{#if showOutput}
  <GestureTilePart elevated={true} class="w-70 flex flex-col justify-center">
    <div class="mx-5">
      <CodeView
        code={gestureProject}
        scale={getMakeCodeGestureConfig(gesture).iconName ? 0.7 : 0.32} />
    </div>
  </GestureTilePart>
{:else}
  <!-- Empty div to fill up grid column -->
  <div></div>
{/if}

{#if enableOutputGestures}
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
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="bg-black p-0 m-0 absolute top-9 left-12.7"
        class:hidden={!hasLoadedMicrobitImage}
        on:click={onUserInteraction}>
        <LedMatrix bind:trigger={triggerFunctions[0]} gesture={$gesture} />
      </div>
    </div>
  </div>
  <OutputSoundSelector onSoundSelection={onSoundSelected} {selectedSound} />
  <PinSelector
    selectedPin={pinIOEnabled ? selectedPin : undefined}
    {turnOnState}
    {turnOnTime}
    {onPinSelect}
    {onTurnOnTimeSelect} />
{/if}
