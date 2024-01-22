<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { createDropdownMenu } from '@melt-ui/svelte';
  import ExternalLinkIcon from 'virtual:icons/ri/external-link-line';
  import HelpIcon from 'virtual:icons/ri/question-line';
  import InfoIcon from 'virtual:icons/ri/information-line';
  import CookiesIcon from 'virtual:icons/mdi/cookie-outline';
  import { manageCookies } from '../../../script/stores/complianceStore';
  import AboutDialog from './AboutDialog.svelte';
  import { t } from '../../../i18n';
  import MeltMenuItems from './MeltMenuItems.svelte';
  import MeltMenuItem from './MeltMenuItem.svelte';

  const dropdownMenu = createDropdownMenu({ forceVisible: true });
  const { trigger } = dropdownMenu.elements;
  const { open } = dropdownMenu.states;

  let isAboutDialogOpen = false;

  const onSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const openLink = (url: string) => window.open(url, '_blank', 'noopener');
    switch (target.value) {
      case 'about': {
        isAboutDialogOpen = true;
        break;
      }
      case 'cookies': {
        manageCookies();
        break;
      }
      case 'terms-of-use': {
        openLink('https://microbit.org/terms-of-use/');
        break;
      }
      case 'help-and-support': {
        openLink('https://support.microbit.org/support/home');
        break;
      }
    }
  };
</script>

<div>
  <AboutDialog
    isOpen={isAboutDialogOpen}
    onClose={() => {
      isAboutDialogOpen = false;
    }} />
  <div class="relative inline-block">
    <button
      {...$trigger}
      use:trigger
      on:select={onSelect}
      aria-label={$t('helpMenu.label')}
      class="inline-flex rounded-full text-xl p-2 outline-none focus-visible:ring-ringBright focus-visible:ring-4 focus-visible:ring-offset-1">
      <HelpIcon class="text-white" />
    </button>
    {#if $open}
      <MeltMenuItems {dropdownMenu}>
        <div class="py-2">
          <MeltMenuItem {dropdownMenu} on:m-click={onSelect} value="help-and-support">
            <ExternalLinkIcon />
            {$t('helpMenu.helpAndSupport')}
          </MeltMenuItem>
        </div>
        <div class="py-2">
          <MeltMenuItem {dropdownMenu} on:m-click={onSelect} value="terms-of-use">
            <ExternalLinkIcon />
            {$t('helpMenu.termsOfUse')}
          </MeltMenuItem>
          <MeltMenuItem {dropdownMenu} on:m-click={onSelect} value="cookies">
            <CookiesIcon />
            {$t('helpMenu.cookies')}
          </MeltMenuItem>
        </div>
        <div class="py-2">
          <MeltMenuItem {dropdownMenu} on:m-click={onSelect} value="about">
            <InfoIcon />
            {$t('helpMenu.about')}
          </MeltMenuItem>
        </div>
      </MeltMenuItems>
    {/if}
  </div>
</div>
