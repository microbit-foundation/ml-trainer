<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { isLoading } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import HomeIcon from 'virtual:icons/ri/home-2-line';
  import AppVersionRedirectDialog from './components/dialogs/AppVersionRedirectDialog.svelte';
  import CompatibilityWarningDialog from './components/dialogs/CompatibilityWarningDialog.svelte';
  import PrototypeVersionWarning from './components/PrototypeVersionWarning.svelte';
  import ConnectDialogContainer from './components/connection-prompt/ConnectDialogContainer.svelte';
  import ControlBar from './components/control-bar/ControlBar.svelte';
  import HelpMenu from './components/control-bar/control-bar-items/HelpMenu.svelte';
  import SettingsMenu from './components/control-bar/control-bar-items/SettingsMenu.svelte';
  import { t } from './i18n';
  import appNameImage from './imgs/app-name.svg';
  import microbitLogoImage from './imgs/microbit-logo.svg';
  import Router from './router/Router.svelte';
  import { Paths, currentPath, getTitle, navigate } from './router/paths';
  import { consent } from './script/stores/complianceStore';
  import {
    ConnectDialogStates,
    connectionDialogState,
  } from './script/stores/connectDialogStore';
  import { btSelectMicrobitDialogOnLoad } from './script/stores/connectionStore';
  import {
    compatibility,
    hasSeenAppVersionRedirectDialog,
    hasSeenSignUpDialog,
    isCompatibilityWarningDialogOpen,
  } from './script/stores/uiStore';
  import { fetchBrowserInfo } from './script/utils/api';
  import IncompatiblePlatformView from './views/IncompatiblePlatformView.svelte';
  import OverlayView from './views/OverlayView.svelte';
  import PageContentView from './views/PageContentView.svelte';
  import SignUpDialog from './components/dialogs/SignUpDialog.svelte';

  let isPotentiallyNextGenUser: boolean = false;
  onMount(async () => {
    if (!get(hasSeenAppVersionRedirectDialog)) {
      const { country } = await fetchBrowserInfo();
      const nextGenAvailableCountries = ['GB', 'JE', 'IM', 'GG'];
      isPotentiallyNextGenUser = !!country && nextGenAvailableCountries.includes(country);
    }

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

  $isCompatibilityWarningDialogOpen = !$compatibility.bluetooth && !$compatibility.usb;
  $: showVersionRedirectDialog = !!(
    !$isCompatibilityWarningDialogOpen && isPotentiallyNextGenUser
  );
  $: showSignUpDialog = !!(
    !$isCompatibilityWarningDialogOpen &&
    !$hasSeenSignUpDialog &&
    (!isPotentiallyNextGenUser ||
      (isPotentiallyNextGenUser && $hasSeenAppVersionRedirectDialog))
  );
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
          <AppVersionRedirectDialog isOpen={showVersionRedirectDialog} />
          <SignUpDialog isOpen={showSignUpDialog} />
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
