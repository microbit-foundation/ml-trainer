<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { state } from '../../script/stores/uiStore';
  import LiveGraph from '../graphs/LiveGraph.svelte';
  import { fade } from 'svelte/transition';
  import { t } from '../../i18n';
  import Microbits from '../../script/microbit-interfacing/Microbits';
  import ConnectedLiveGraphButtons from './ConnectedLiveGraphButtons.svelte';
  import LiveGraphInformationSection from './LiveGraphInformationSection.svelte';
  import BaseDialog from '../dialogs/BaseDialog.svelte';
  import View3DLive from '../3d-inspector/View3DLive.svelte';

  const live3dViewVisible = false;
  const live3dViewSize = live3dViewVisible ? 160 : 0;
  let componentWidth: number;
  let isLive3DOpen = false;

  const inputDisconnectButtonClicked = () => {
    Microbits.expelInputAndOutput();
  };

  const outputDisconnectButtonClicked = () => {
    Microbits.expelOutput();
  };
</script>

<div
  bind:clientWidth={componentWidth}
  class="h-full w-full bg-backgrounddark"
  class:bg-gray-300={$state.isInputAssigned && !$state.isInputReady}>
  {#if $state.isInputAssigned}
    <!-- Input microbit is assigned -->
    <div class="relative w-full h-full bg-white">
      <div class="absolute w-full h-full">
        <LiveGraph width={componentWidth - live3dViewSize} />
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
        class="h-full flex p-0 m-0 absolute top-0 left-0 right-40 border-r border-solid border-black border-opacity-60">
        <!-- The live text and info box -->
        <div class="mt-5 ml-2">
          <LiveGraphInformationSection />
        </div>
        <div class="mt-4">
          <ConnectedLiveGraphButtons
            onInputDisconnectButtonClicked={inputDisconnectButtonClicked}
            onOutputDisconnectButtonClicked={outputDisconnectButtonClicked} />
        </div>
      </div>
      <div
        class="absolute right-0 cursor-pointer hover:bg-secondary hover:bg-opacity-10 transition"
        on:click={() => (isLive3DOpen = true)}>
        <View3DLive
          width={live3dViewSize}
          height={live3dViewSize}
          freeze={isLive3DOpen} />
      </div>
      <BaseDialog isOpen={isLive3DOpen} onClose={() => (isLive3DOpen = false)}>
        <!-- hardcoded margin-left matches the size of the sidebar -->
        <div
          class="ml-75 border-gray-200 overflow-hidden border border-solid relative bg-white rounded-1 shadow-dark-400 shadow-md flex justify-center"
          style="height: calc(100vh - {live3dViewSize}px); width: calc(100vh - {live3dViewSize}px);">
          <div class="-mt-5 w-full h-full justify-center align-middle flex items-center">
            <View3DLive width={600} height={600} smoothing />
          </div>
        </div>
      </BaseDialog>
    </div>
  {/if}
</div>
