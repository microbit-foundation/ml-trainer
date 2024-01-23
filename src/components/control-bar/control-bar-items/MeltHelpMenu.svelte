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

  const menu = createDropdownMenu({ forceVisible: true });
  const { trigger } = menu.elements;
  const { open } = menu.states;

  let isAboutDialogOpen = false;

  const openLink = (url: string) => window.open(url, '_blank', 'noopener');

  const onAboutClick = () => {
    isAboutDialogOpen = true;
  };
  const onTermsOfUseClick = () => {
    openLink('https://microbit.org/terms-of-use/');
  };
  const onHelpAndSupportClick = () => {
    openLink('https://support.microbit.org/support/home');
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
      aria-label={$t('helpMenu.label')}
      class="inline-flex rounded-full text-xl p-2 outline-none focus-visible:ring-ringBright focus-visible:ring-4 focus-visible:ring-offset-1">
      <HelpIcon class="text-white" />
    </button>
    {#if $open}
      <MeltMenuItems {menu}>
        <div class="py-2">
          <MeltMenuItem {menu} on:m-click={onHelpAndSupportClick}>
            <ExternalLinkIcon />
            {$t('helpMenu.helpAndSupport')}
          </MeltMenuItem>
        </div>
        <div class="py-2">
          <MeltMenuItem {menu} on:m-click={onTermsOfUseClick}>
            <ExternalLinkIcon />
            {$t('helpMenu.termsOfUse')}
          </MeltMenuItem>
          <MeltMenuItem {menu} on:m-click={manageCookies}>
            <CookiesIcon />
            {$t('helpMenu.cookies')}
          </MeltMenuItem>
        </div>
        <div class="py-2">
          <MeltMenuItem {menu} on:m-click={onAboutClick}>
            <InfoIcon />
            {$t('helpMenu.about')}
          </MeltMenuItem>
        </div>
      </MeltMenuItems>
    {/if}
  </div>
</div>
