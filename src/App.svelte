<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import OverlayView from './views/OverlayView.svelte';
  import PageContentView from './views/PageContentView.svelte';
  import {
    compatibility,
    isCompatibilityWarningDialogOpen,
  } from './script/stores/uiStore';
  import IncompatiblePlatformView from './views/IncompatiblePlatformView.svelte';
  import CompatibilityWarningDialog from './components/CompatibilityWarningDialog.svelte';
  import Router from './router/Router.svelte';
  import ControlBar from './components/control-bar/ControlBar.svelte';
  import { t } from './i18n';
  import { consent } from './script/stores/complianceStore';
  import microbitLogoImage from './imgs/microbit-logo.svg';
  import appNameImage from './imgs/app-name.svg';
  import HelpMenu from './components/control-bar/control-bar-items/HelpMenu.svelte';
  import SettingsMenu from './components/control-bar/control-bar-items/SettingsMenu.svelte';
  import { onMount } from 'svelte';
  import ConnectDialogContainer from './components/connection-prompt/ConnectDialogContainer.svelte';
  import { Paths, currentPath, getTitle, navigate } from './router/paths';
  import HomeIcon from 'virtual:icons/ri/home-2-line';
  import { btSelectMicrobitDialogOnLoad } from './script/stores/connectionStore';
  import {
    ConnectDialogStates,
    connectionDialogState,
  } from './script/stores/connectDialogStore';
  import { isLoading } from 'svelte-i18n';
  import PrototypeVersionWarning from './components/PrototypeVersionWarning.svelte';

  onMount(() => {
    const { bluetooth, usb } = $compatibility;
    // Value must switch from false to true after mount to trigger dialog transition
    isCompatibilityWarningDialogOpen.set(!bluetooth && !usb);

    if ($btSelectMicrobitDialogOnLoad) {
      $connectionDialogState.connectionState =
        ConnectDialogStates.CONNECT_TUTORIAL_BLUETOOTH;
      $btSelectMicrobitDialogOnLoad = false;
    }
  });

  let routeAnnouncementEl: HTMLDivElement | undefined;
  $: {
    if (routeAnnouncementEl) {
      routeAnnouncementEl.textContent = getTitle($currentPath, $t);
    }
  }
</script>

{#if !$isLoading}
  <Router>
    <div class="sr-only" bind:this={routeAnnouncementEl} aria-live="polite" />
    {#if !$compatibility.platformAllowed}
      <!-- Denies mobile users access to the platform -->
      <IncompatiblePlatformView />
    {:else}
      <div class="h-full w-full m-0 relative flex">
        <OverlayView />
        <!-- Wait for consent dialog to avoid a clash -->
        {#if $consent}
          <CompatibilityWarningDialog />
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
              <a
                class="text-xl p-2 rounded-full outline-none focus-visible:ring-ringBright focus-visible:ring-4 focus-visible:ring-offset-1"
                href={Paths.HOME}
                on:click|preventDefault={() => navigate(Paths.HOME)}>
                <span class="sr-only">{$t('homepage.Link')}</span>
                <HomeIcon class="text-white" aria-hidden />
              </a>
              <SettingsMenu />
              <HelpMenu />
            </div>
          </ControlBar>
          <PrototypeVersionWarning />

          <div class="relative flex-1 flex-row">
            <PageContentView />
          </div>
        </div>
      </div>
    {/if}
  </Router>
  <ConnectDialogContainer />
{/if}
