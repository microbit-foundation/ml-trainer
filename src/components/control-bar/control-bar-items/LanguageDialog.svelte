<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardButton from '../../StandardButton.svelte';
  import { allLanguages, t } from '../../../i18n';
  import { locale as currentLocale } from 'svelte-i18n';
  import StandardDialog from '../../dialogs/StandardDialog.svelte';
  import DialogHeading from '../../DialogHeading.svelte';

  export let onClose: () => void;
  export let isOpen: boolean;
</script>

<StandardDialog {isOpen} {onClose}>
  <div class="flex flex-col gap-5 w-150">
    <DialogHeading>{$t('languageDialog.title')}</DialogHeading>
    <div class="grid grid-cols-2 gap-5">
      {#each allLanguages as language}
        <button
          class="flex items-stretch p-3 rounded-xl h-auto border-2 border-gray-200 text-link hover:bg-gray-100"
          on:click={() => {
            $currentLocale = language.id;
            onClose();
          }}>
          <div class="flex flex-col text-center w-full gap-2">
            <p class="text-lg font-bold">{language.name}</p>
            <p class="text-sm text-gray-700">{language.enName}</p>
          </div>
        </button>
      {/each}
    </div>
    <div class="flex justify-end">
      <StandardButton onClick={onClose} type="primary"
        >{$t('actions.close')}</StandardButton>
    </div>
  </div>
</StandardDialog>
