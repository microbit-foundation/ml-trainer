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
  import MenuItems from './MenuItems.svelte';
  import MenuItem from './MenuItem.svelte';
  import IconButton from '../../IconButton.svelte';

  const menu = createDropdownMenu({ forceVisible: true });
  const { trigger } = menu.elements;
  const { open } = menu.states;

  let isAboutDialogOpen = false;
  let helpButtonRef: IconButton | null;

  const openLink = (url: string) => window.open(url, '_blank', 'noopener');

  const onAboutClick = () => {
    isAboutDialogOpen = true;
  };
  const onAboutDialogClose = () => {
    isAboutDialogOpen = false;
    helpButtonRef?.focus();
  };
  const onTermsOfUseClick = () => {
    openLink('https://microbit.org/terms-of-use/');
  };
  const onPrivacyPolicyClick = () => {
    openLink('https://microbit.org/privacy/#the-playground-survey');
  };
  const onHelpAndSupportClick = () => {
    openLink('https://support.microbit.org/support/home');
  };
</script>

<div>
  <AboutDialog isOpen={isAboutDialogOpen} onClose={onAboutDialogClose} />
  <div class="relative inline-block">
    <IconButton
      bind:this={helpButtonRef}
      ariaLabel={$t('helpMenu.label')}
      rounded
      {...$trigger}
      useAction={trigger}
      class="inline-flex rounded-full text-xl p-2 outline-none focus-visible:ring-ringBright focus-visible:ring-4 focus-visible:ring-offset-1">
      <HelpIcon class="text-white" />
    </IconButton>
    {#if $open}
      <MenuItems {menu}>
        <div class="py-2">
          <MenuItem {menu} on:m-click={onHelpAndSupportClick}>
            <ExternalLinkIcon />
            {$t('helpMenu.helpAndSupport')}
          </MenuItem>
        </div>
        <div class="py-2">
          <MenuItem {menu} on:m-click={onTermsOfUseClick}>
            <ExternalLinkIcon />
            {$t('helpMenu.termsOfUse')}
          </MenuItem>
          <MenuItem {menu} on:m-click={onPrivacyPolicyClick}>
            <ExternalLinkIcon />
            {$t('helpMenu.privacyPolicy')}
          </MenuItem>
          <MenuItem {menu} on:m-click={manageCookies}>
            <CookiesIcon />
            {$t('helpMenu.cookies')}
          </MenuItem>
        </div>
        <div class="py-2">
          <MenuItem {menu} on:m-click={onAboutClick}>
            <InfoIcon />
            {$t('helpMenu.about')}
          </MenuItem>
        </div>
      </MenuItems>
    {/if}
  </div>
</div>
