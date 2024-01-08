<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardButton from '../../StandardButton.svelte';
  import StandardDialog from '../../dialogs/StandardDialog.svelte';
  import microbitLogo from '../../../imgs/microbit-logo-black.svg';
  import microbitHeartImage from '../../../imgs/microbit-heart.png';
  import aarhusLogo from '../../../imgs/aulogo_uk_var2_blue.png';
  import GitHubIcon from 'virtual:icons/ri/github-fill';
  import { t } from '../../../i18n';

  export let onClose: () => void;
  export let isOpen: boolean;
</script>

<StandardDialog {isOpen} {onClose}>
  <div class="flex flex-col gap-5 w-150 text-black">
    <div class="flex flex-col gap-8">
      <div class="grid grid-cols-2 gap-20 items-center">
        <img src={microbitLogo} alt="micro:bit" />
        <img src={aarhusLogo} alt="Aarhus" />
      </div>
      <p class="text-center">
        {$t('about.developedInPartnership')}
      </p>
      <div class="grid grid-cols-2 gap-5 items-center text-center">
        <img
          class="flex-1"
          src={microbitHeartImage}
          width="724"
          height="589"
          alt={$t('about.microbitHeartImageAlt')} />
        <table class="text-sm">
          <tbody
            ><tr class="divide-gray-100"
              ><td>{$t('content.index.title')}</td><td
                >{import.meta.env.VITE_APP_VERSION}</td
              ><td class="flex align-middle"
                ><a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://github.com/microbit-foundation/ml-trainer"
                  class="flex basis-auto outline-none focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:ring-ring"
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
</StandardDialog>
