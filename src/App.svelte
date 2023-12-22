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
  import {
    compatibility,
    isBluetoothWarningDialogOpen,
    state,
  } from './script/stores/uiStore';
  import { checkCompatibility } from './script/compatibility/CompatibilityChecker';
  import IncompatiblePlatformView from './views/IncompatiblePlatformView.svelte';
  import BluetoothIncompatibilityWarningDialog from './components/BluetoothIncompatibilityWarningDialog.svelte';
  import CookieManager from './script/CookieManager';
  import { DeviceRequestStates } from './script/stores/connectDialogStore';
  import Environment from './script/Environment';
  import Router from './router/Router.svelte';
  import ControlBar from './components/control-bar/ControlBar.svelte';
  import { t } from './i18n';
  import { consent } from './script/stores/complianceStore';
  import microbitLogoImage from './imgs/microbit-logo.svg';
  import HelpMenu from './components/control-bar/control-bar-items/HelpMenu.svelte';
  import SettingsMenu from './components/control-bar/control-bar-items/SettingsMenu.svelte';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  ConnectionBehaviours.setInputBehaviour(new InputBehaviour());
  ConnectionBehaviours.setOutputBehaviour(new OutputBehaviour());

  if (CookieManager.isReconnectFlagSet()) {
    $state.offerReconnect = true;
    $state.reconnectState = DeviceRequestStates.INPUT;
    CookieManager.unsetReconnectFlag();
  }

  document.title = Environment.pageTitle;

  onMount(() => {
    // Value must switch from false to true after mount to trigger dialog transition
    isBluetoothWarningDialogOpen.set(!get(compatibility).bluetooth);
  });
</script>

<Router>
  {#if !checkCompatibility().platformAllowed}
    <!-- Denies mobile users access to the platform -->
    <IncompatiblePlatformView />
  {:else}
    <main class="h-full w-full m-0 relative flex">
      <OverlayView />
      <!-- Wait for consent dialog to avoid a clash -->
      {#if $consent}
        <BluetoothIncompatibilityWarningDialog />
      {/if}

      <div class="w-full flex flex-col bg-backgrounddark">
        <ControlBar>
          <div class="flex items-center divide-x h-full">
            <img src={microbitLogoImage} alt="micro:bit" width="150px" class="pr-3" />
            <h1 class="text-xl tracking-wide whitespace-nowrap pl-3">
              {$t('content.index.title')}
            </h1>
          </div>
          <div class="flex flex-row basis-full justify-end">
            <div class="flex h-full gap-5">
              <SettingsMenu />
              <HelpMenu />
            </div>
          </div>
        </ControlBar>

        <div class="relative flex-1 flex-row">
          <PageContentView />
        </div>
      </div>
    </main>
  {/if}
</Router>
