<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardButton from '../../StandardButton.svelte';
  import microbitLogo from '../../../imgs/microbit-logo-black.svg';
  import microbitHeartImage from '../../../imgs/microbit-heart.png';
  import aarhusLogo from '../../../imgs/aulogo_uk_var2_blue.png';
  import GitHubIcon from 'virtual:icons/ri/github-fill';
  import { t } from '../../../i18n';
  import HtmlFormattedMessage, {
    linkWithProps as linkWithProps,
  } from '../../HtmlFormattedMessage.svelte';
  import Dialog from '../../dialogs/StandardDialog.svelte';

  export let onClose: () => void;
  export let isOpen: boolean;
</script>

<Dialog {isOpen} {onClose}>
  <div class="flex flex-col gap-5 w-150 text-black">
    <div class="flex flex-col gap-8">
      <div class="grid grid-cols-2 gap-20 items-center">
        <img src={microbitLogo} alt="micro:bit" />
        <img src={aarhusLogo} alt="Aarhus" />
      </div>
      <p class="text-center">
        <HtmlFormattedMessage
          id="about.developedInPartnership"
          options={{
            values: {
              link: linkWithProps({
                href: 'https://cctd.au.dk/',
                target: '_blank',
                rel: 'noopener',
              }),
            },
          }} />
      </p>
      <div class="grid grid-cols-2 gap-5 items-center text-center">
        <img
          class="w-290px h-236px"
          src={microbitHeartImage}
          alt={$t('about.microbitHeartImageAlt')} />
        <table class="text-sm">
          <tbody
            ><tr class="divide-gray-100"
              ><td>{$t('content.index.title')}</td><td
                >{import.meta.env.VITE_APP_VERSION}</td
              ><td
                ><a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://github.com/microbit-foundation/ml-trainer"
                  class="inline-flex items-center outline-none focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:ring-ring"
                  ><GitHubIcon /><span class="sr-only">GitHub</span></a>
              </td></tr
            ></tbody
          ><caption class="p-2">{$t('about.softwareVersions')}</caption>
        </table>
      </div>
    </div>
    <div class="flex justify-end">
      <StandardButton onClick={onClose} type="primary"
        >{$t('actions.close')}</StandardButton>
    </div>
  </div>
</Dialog>
