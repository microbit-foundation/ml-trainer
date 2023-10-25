<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { state } from '../../script/stores/uiStore';
  import LiveGraph from '../graphs/LiveGraph.svelte';
  import { fade } from 'svelte/transition';
  import { t } from '../../i18n';
  import ConnectDialogContainer from '../connection-prompt/ConnectDialogContainer.svelte';
  import Microbits from '../../script/microbit-interfacing/Microbits';
  import StandardButton from '../StandardButton.svelte';
  import { startConnectionProcess, startSerialConnection } from '../../script/stores/connectDialogStore';
  import ConnectedLiveGraphButtons from './ConnectedLiveGraphButtons.svelte';
  import LiveGraphInformationSection from './LiveGraphInformationSection.svelte';
  import BaseDialog from '../dialogs/BaseDialog.svelte';
  import Live3DViewCompatabilityWrapper from '../3d-inspector/View3D.svelte';
  import View3DLive from '../3d-inspector/View3DLive.svelte';

  let componentWidth: number;
  let connectDialogReference: ConnectDialogContainer;

  const connectButtonClicked = () => {
    startConnectionProcess();
  };

  const inputDisconnectButtonClicked = () => {
    Microbits.expelInputAndOutput();
  };

  const outputDisconnectButtonClicked = () => {
    Microbits.expelOutput();
  };

  const serialButtonClicked = () => {
    startSerialConnection();
  }

  let isLive3DOpen = false;
</script>

<div
  bind:clientWidth={componentWidth}
  class="h-full w-full bg-white border-t border-solid border-black border-opacity-60 shadow-black shadow-xl"
  class:bg-gray-300={$state.isInputAssigned && !$state.isInputReady}>
  <ConnectDialogContainer bind:this={connectDialogReference} />

  {#if !$state.isInputAssigned}
    <!-- No input microbit assigned -->
    <div class="h-full w-full flex justify-center bg-white">
      <StandardButton onClick={connectButtonClicked}
        >{$t('footer.connectButtonNotConnected')}</StandardButton>
        <StandardButton onClick={serialButtonClicked}>
          Connect to serial
        </StandardButton>
    </div>
  {:else}
    <!-- Input microbit is assigned -->
    <div class="relative w-full h-full">
      <div class="absolute w-full h-full">
        <LiveGraph width={componentWidth - 160} />
      </div>
      {#if !$state.isInputReady}
        <!-- Input is not ready, but is assigned (Must be either reconnecting or have lost connection entirely) -->
        <div
          class="absolute w-full h-full flex items-center justify-center text-secondarytext">
          <div class="bg-secondary bg-opacity-80 py-2 px-4 rounded-full" transition:fade>
            <h1>{$t('footer.reconnecting')}</h1>
          </div>
        </div>
      {/if}
      <div
        class="h-full p-0 m-0 absolute top-0 left-0 right-40 border-r border-solid border-black border-opacity-60">
        <!-- The live text and info box -->
        <div class="float-left mt-2 ml-2">
          <LiveGraphInformationSection />
        </div>
        <div class="absolute right-2 top-2 m-0 float-right">
          <ConnectedLiveGraphButtons
            onInputDisconnectButtonClicked={inputDisconnectButtonClicked}
            onOutputConnectButtonClicked={connectButtonClicked}
            onOutputDisconnectButtonClicked={outputDisconnectButtonClicked} />
        </div>
      </div>
      <div
        class="absolute right-0 cursor-pointer hover:bg-secondary hover:bg-opacity-10 transition"
        on:click={() => (isLive3DOpen = true)}>
        <View3DLive width={160} height={160} freeze={isLive3DOpen} />
      </div>
      <BaseDialog isOpen={isLive3DOpen} onClose={() => (isLive3DOpen = false)}>
        <!-- hardcoded margin-left matches the size of the sidebar -->
        <div
          class="ml-75 border-gray-200 overflow-hidden border border-solid relative bg-white rounded-1 shadow-dark-400 shadow-md flex justify-center"
          style="height: calc(100vh - 160px); width: calc(100vh - 160px);">
          <div class="-mt-5 w-full h-full justify-center align-middle flex items-center">
            <View3DLive width={600} height={600} smoothing />
          </div>
        </div>
      </BaseDialog>
    </div>
  {/if}
</div>
