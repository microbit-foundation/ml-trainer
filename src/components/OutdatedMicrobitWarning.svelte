<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { horizontalSlide } from '../script/transitions';
  import StandardButton from './StandardButton.svelte';
  import { t } from '../i18n';
  import Microbits, { HexOrigin } from '../script/microbit-interfacing/Microbits';
  import {
    ConnectDialogStates,
    DeviceRequestStates,
    connectionDialogState,
  } from '../script/stores/connectDialogStore';
  import StaticConfiguration from '../StaticConfiguration';
  let hasBeenClosed = false;
  export let targetRole: 'INPUT' | 'OUTPUT';
  let showMakeCodeUpdateMessage =
    targetRole === 'INPUT' ? Microbits.isInputMakecode() : Microbits.isOutputMakecode();

  const updateNowHasBeenClicked = () => {
    let microbitOrigin =
      targetRole === 'INPUT' ? Microbits.getInputOrigin() : Microbits.getOutputOrigin();
    expelMicrobit();
    if (microbitOrigin === HexOrigin.PROPRIETARY) {
      openConnectionPrompt();
    } else if (microbitOrigin === HexOrigin.MAKECODE) {
      window.open(StaticConfiguration.makecodeFirmwareUrl, '_blank');
    }
    hasBeenClosed = true;
  };

  const expelMicrobit = () => {
    if (Microbits.isInputOutputTheSame()) {
      Microbits.expelInputAndOutput();
    } else {
      if (targetRole === 'INPUT') {
        Microbits.expelInput();
      } else {
        Microbits.expelOutput();
      }
    }
  };

  const openConnectionPrompt = () => {
    // We don't use ConnectDialogStates.USB_START elsewhere and don't use this component.
    // $connectionDialogState.connectionState = ConnectDialogStates.USB_START;
    // $connectionDialogState.deviceState =
    //   targetRole === 'INPUT' ? DeviceRequestStates.INPUT : DeviceRequestStates.OUTPUT;
  };
</script>

{#if !hasBeenClosed}
  <div
    class="absolute top-8 right-4 bg-white rounded-md p-6 border-1 border-black z-5"
    transition:horizontalSlide>
    <div class="w-100">
      <div class="absolute right-2 top-2 svelte-1rnkjvh">
        <button
          on:click={() => (hasBeenClosed = true)}
          class="hover:bg-gray-100 rounded outline-transparent w-8 svelte-1rnkjvh">
          <i
            class="fas fa-plus text-lg text-gray-600 hover:text-gray-800 duration-75 svelte-1rnkjvh"
            style="transform: rotate(45deg);" />
        </button>
      </div>
      <p class="text-black font-bold">{$t('popup.outdatedmicrobit.header')}</p>
      {#if showMakeCodeUpdateMessage}
        <p>{$t('popup.outdatedmicrobit.text')}</p>
        <p>{$t('popup.outdatedmicrobit.text.mkcd')}</p>
        <div class="flex mt-5 justify-center">
          <StandardButton onClick={() => (hasBeenClosed = true)}
            >{$t('popup.outdatedmicrobit.button.later')}</StandardButton>
          <div class="w-3" />
          <StandardButton type="primary" onClick={updateNowHasBeenClicked}
            >{$t('popup.outdatedmicrobit.button.update.mkcd')}</StandardButton>
        </div>
      {:else}
        <p>{$t('popup.outdatedmicrobit.text')}</p>
        <div class="flex mt-5 justify-center">
          <StandardButton onClick={() => (hasBeenClosed = true)}
            >{$t('popup.outdatedmicrobit.button.later')}</StandardButton>
          <div class="w-3" />
          <StandardButton type="primary" onClick={updateNowHasBeenClicked}
            >{$t('popup.outdatedmicrobit.button.update')}</StandardButton>
        </div>
      {/if}
    </div>
  </div>
{/if}
