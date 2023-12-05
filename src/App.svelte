<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import ConnectionBehaviours from './script/connection-behaviours/ConnectionBehaviours';
  import InputBehaviour from './script/connection-behaviours/InputBehaviour';
  import OutputBehaviour from './script/connection-behaviours/OutputBehaviour';
  import OverlayView from './views/OverlayView.svelte';
  import PageContentView from './views/PageContentView.svelte';
  import { state } from './script/stores/uiStore';
  import { checkCompatibility } from './script/compatibility/CompatibilityChecker';
  import IncompatiblePlatformView from './views/IncompatiblePlatformView.svelte';
  import BluetoothIncompatibilityWarningDialog from './components/BluetoothIncompatibilityWarningDialog.svelte';
  import CookieManager from './script/CookieManager';
  import { DeviceRequestStates } from './script/stores/connectDialogStore';
  import Environment from './script/Environment';
  import Router from './router/Router.svelte';
  import ControlBar from './components/control-bar/ControlBar.svelte';
  import SelectLanguageControlBarDropdown from './components/control-bar/control-bar-items/SelectLanguageControlBarDropdown.svelte';
  import BottomPanel from './components/bottom/BottomPanel.svelte';
  import { t } from './i18n';
  import { consent } from './script/stores/complianceStore';
  import microbitLogoImage from './imgs/microbit-logo.svg';

  ConnectionBehaviours.setInputBehaviour(new InputBehaviour());
  ConnectionBehaviours.setOutputBehaviour(new OutputBehaviour());

  if (CookieManager.isReconnectFlagSet()) {
    $state.offerReconnect = true;
    $state.reconnectState = DeviceRequestStates.INPUT;
    CookieManager.unsetReconnectFlag();
  }

  document.title = Environment.pageTitle;
</script>

<Router>
  {#if !checkCompatibility().platformAllowed}
    <!-- Denies mobile users access to the platform -->
    <IncompatiblePlatformView />
  {:else}
    <main class="h-full w-screen m-0 relative flex">
      <OverlayView />
      <!-- Wait for consent dialog to avoid a clash -->
      {#if $consent}
        <BluetoothIncompatibilityWarningDialog />
      {/if}

      <div class="w-full flex flex-col bg-backgrounddark">
        <ControlBar>
          <img class="mr-8" src={microbitLogoImage} alt="Micro:bit logo" width="150px" />
          <h1 class="text-xl font-thin whitespace-nowrap">{$t('content.index.title')}</h1>
          <div class="flex flex-row basis-full justify-end">
            <SelectLanguageControlBarDropdown />
          </div>
        </ControlBar>

        <div class="relative z-1 flex-1 flex-row">
          <PageContentView />
        </div>

        {#if $state.isInputConnected}
          <div class="h-160px w-full">
            <BottomPanel />
          </div>
        {/if}
      </div>
    </main>
  {/if}
</Router>
