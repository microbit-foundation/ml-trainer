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
  import appNameImage from './imgs/app-name.svg';
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
            <div class="h-32px flex items-center">
              <img class="pr-3 w-166px" src={microbitLogoImage} alt="micro:bit" />
            </div>
            <div class="h-32px flex items-center">
              <img
                class="pl-3 mt-2px w-253px"
                src={appNameImage}
                alt={$t('content.index.title')} />
            </div>
          </div>
          <div class="flex gap-5">
            <SettingsMenu />
            <HelpMenu />
          </div>
        </ControlBar>

        <div class="relative flex-1 flex-row">
          <PageContentView />
        </div>
      </div>
    </main>
  {/if}
</Router>
