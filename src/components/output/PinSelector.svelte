<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import GestureTilePart from './../GestureTilePart.svelte';
  import StaticConfiguration from '../../StaticConfiguration';
  import { PinTurnOnState } from './PinSelectorUtil';
  import { t } from '../../i18n';
  import MBSpecs from '../../script/microbit-interfacing/MBSpecs';
  export let onPinSelect: (pin: MBSpecs.UsableIOPin) => void;
  export let onTurnOnTimeSelect: (turnOnArgs: {
    turnOnState: PinTurnOnState;
    turnOnTime: number;
  }) => void;

  export let turnOnTime: number;
  export let turnOnState: PinTurnOnState;
  export let selectedPin: MBSpecs.UsableIOPin | undefined;

  let selectedTurnOnState = turnOnState;
  let turnOnTimeInSeconds = turnOnTime / 1000;

  const onPinSelected = (pin: MBSpecs.IOPin) => {
    if (!includes(StaticConfiguration.supportedPins, pin)) {
      return;
    }
    onPinSelect(pin as MBSpecs.UsableIOPin);
  };

  const onTurnOnStateSelect = () => {
    onTurnOnTimeSelect({
      turnOnState: selectedTurnOnState,
      turnOnTime: turnOnTimeInSeconds * 1000,
    });
  };

  const largePins: MBSpecs.IOPin[] = [0, 1, 2, '3V', 'GND'];

  // Hacky way to check if a value is included in an array since typescript
  // has made a very poor decision on how array.includes() is typed
  function includes<T>(array: T[], value: unknown): boolean {
    return array.includes(value as T);
  }
</script>

<GestureTilePart>
  <div class="flex flex-row">
    {#each MBSpecs.IO_PIN_LAYOUT as currentPin}
      {#if includes(StaticConfiguration.supportedPins, currentPin)}
        <!-- These are pins we support, make them selectable and yellow -->
        {#if largePins.includes(currentPin)}
          <!-- Large pins -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            on:click={() => {
              onPinSelected(currentPin);
            }}
            class="h-8 w-7 rounded-bl-xl ml-1px rounded-br-xl bg-yellow-300 cursor-pointer"
            class:border-yellow-500={selectedPin === currentPin}
            class:border-width-2={selectedPin === currentPin}
            class:h-9={selectedPin === currentPin}
            class:hover:bg-yellow-200={selectedPin !== currentPin}
            class:bg-opacity-80={selectedPin !== currentPin}>
            <p class="text-center text-xs select-none">{currentPin}</p>
          </div>
        {:else}
          <!-- Small pins -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            on:click={() => {
              onPinSelected(currentPin);
            }}
            class:bg-yellow-600={selectedPin === currentPin}
            class="bg-yellow-400 h-7 w-1 rounded-bl-xl ml-1px rounded-br-xl hover:bg-yellow-300" />
        {/if}
      {:else}
        <!-- This are pins we DO NOT support, make them non-selectable and gray -->
        {#if largePins.includes(currentPin)}
          <!-- Large pins -->
          <div class="bg-amber-200 opacity-40 h-8 w-7 rounded-bl-xl ml-1px rounded-br-xl">
            <p class="text-center text-xs select-none">{currentPin}</p>
          </div>
        {:else}
          <!-- Small pins -->
          <div
            class="bg-amber-200 opacity-40 h-7 w-1 rounded-bl-xl ml-1px rounded-br-xl" />
        {/if}
      {/if}
    {/each}
  </div>

  <div
    id="test"
    class:hidden={selectedPin === undefined}
    class="flex flex-col justify-center items-center">
    <div class="flex flex-row w-full mt-2 justify-around">
      <div class="flex flex-col">
        <input
          type="radio"
          bind:group={selectedTurnOnState}
          on:change={onTurnOnStateSelect}
          on:click|stopPropagation
          value={PinTurnOnState.ALL_TIME} />
        <p>{$t('content.model.output.pin.option.allTime')}</p>
      </div>
      <div class="flex flex-col">
        <input
          type="radio"
          bind:group={selectedTurnOnState}
          on:change={onTurnOnStateSelect}
          on:click|stopPropagation
          value={PinTurnOnState.X_TIME} />
        <p>{$t('content.model.output.pin.option.xTime')}</p>
      </div>
    </div>
    <div class="w-40 mt-4">
      {#if turnOnState === PinTurnOnState.X_TIME}
        <div class="flex flex-row justify-center">
          <p class="mr-2">{$t('content.model.output.pin.seconds')}</p>
          <input
            type="number"
            on:change={onTurnOnStateSelect}
            class="w-12 border-1 border-primaryborder"
            bind:value={turnOnTimeInSeconds} />
        </div>
      {/if}
    </div>
  </div>
</GestureTilePart>
