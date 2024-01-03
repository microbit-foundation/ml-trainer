<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import LiveGraph from '../graphs/LiveGraph.svelte';
  import { t } from '../../i18n';
  import ConnectedLiveGraphButtons from './ConnectedLiveGraphButtons.svelte';
  import LiveGraphInformationSection from './LiveGraphInformationSection.svelte';
  import BaseDialog from '../dialogs/BaseDialog.svelte';
  import View3DLive from '../3d-inspector/View3DLive.svelte';
  import Information from '../information/Information.svelte';

  const live3dViewVisible = false;
  const live3dViewSize = live3dViewVisible ? 160 : 0;
  let componentWidth: number;
  let isLive3DOpen = false;
</script>

<div bind:clientWidth={componentWidth} class="relative w-full h-full bg-white">
  <div class="relative z-1">
    <div
      class="flex items-center justify-between gap-2 pt-4 px-7 m-0 absolute top-0 left-0 right-0">
      <div class="flex items-center gap-2">
        <!-- The live text and info box -->
        <LiveGraphInformationSection />
        <ConnectedLiveGraphButtons />
      </div>
      <Information
        titleText={$t('footer.helpHeader')}
        bodyText={$t('footer.helpContent')}
        isLightTheme={false}
        boxOffset={{ x: 0, y: -150 }} />
    </div>
    {#if live3dViewVisible}
      <!-- Unused part since live3dViewVisible is always false  -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="absolute right-0 cursor-pointer hover:bg-secondary hover:bg-opacity-10 transition"
        on:click={() => (isLive3DOpen = true)}>
        <View3DLive
          width={live3dViewSize}
          height={live3dViewSize}
          freeze={isLive3DOpen} />
      </div>
      <BaseDialog isOpen={isLive3DOpen} onClose={() => (isLive3DOpen = false)}>
         hardcoded margin-left matches the size of the sidebar 
        <div
          class="ml-75 border-gray-200 overflow-hidden border border-solid relative bg-white rounded-1 shadow-dark-400 shadow-md flex justify-center"
          style="height: calc(100vh - {live3dViewSize}px); width: calc(100vh - {live3dViewSize}px);">
          <div class="-mt-5 w-full h-full justify-center align-middle flex items-center">
            <View3DLive width={600} height={600} smoothing />
          </div>
        </div>
      </BaseDialog>
    {/if}
  </div>
  <div class="absolute w-full h-full">
    <LiveGraph width={componentWidth - live3dViewSize} />
  </div>
</div>
