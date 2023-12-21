<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { createMenu } from 'svelte-headlessui';
  import ExternalLinkIcon from 'virtual:icons/ri/external-link-line';
  import HelpIcon from 'virtual:icons/ri/question-line';
  import InfoIcon from 'virtual:icons/ri/information-line';
  import CookiesIcon from 'virtual:icons/mdi/cookie-outline';
  import MenuTransition from '../../MenuTransition.svelte';
  import { manageCookies } from '../../../script/stores/complianceStore';
  import AboutDialog from './AboutDialog.svelte';
  import { t } from '../../../i18n';
  import MenuItems from './MenuItems.svelte';
  import MenuItem from './MenuItem.svelte';

  const menu = createMenu({ label: $t('helpMenu.label') });
  let isAboutDialogOpen = false;

  const onSelect = (event: Event) => {
    const { selected } = (event as CustomEvent).detail;
    const openLink = (url: string) => window.open(url, '_blank', 'noopener');
    switch (selected) {
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
    menu.set({ selected: null });
  };
</script>

<AboutDialog
  isOpen={isAboutDialogOpen}
  onClose={() => {
    isAboutDialogOpen = false;
  }} />
<div class="relative inline-block">
  <button
    use:menu.button
    on:select={onSelect}
    class="inline-flex rounded-full text-xl p-2">
    <HelpIcon />
  </button>
  <MenuTransition show={$menu.expanded}>
    <MenuItems {menu}>
      <div class="py-2">
        <MenuItem {menu} value="help-and-support">
          <ExternalLinkIcon />
          {$t('helpMenu.helpAndSupport')}
        </MenuItem>
      </div>
      <div class="py-2">
        <MenuItem {menu} value="terms-of-use">
          <ExternalLinkIcon />
          {$t('helpMenu.termsOfUse')}
        </MenuItem>
        <MenuItem {menu} value="cookies">
          <CookiesIcon />
          {$t('helpMenu.cookies')}
        </MenuItem>
      </div>
      <div class="py-2">
        <MenuItem {menu} value="about">
          <InfoIcon />
          {$t('helpMenu.about')}
        </MenuItem>
      </div>
    </MenuItems></MenuTransition>
</div>
