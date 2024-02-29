<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { get } from 'svelte/store';
  import { t } from '../i18n';
  import { hasSeenRedirectToOtherVersionDialog } from '../script/stores/uiStore';
  import StandardDialog from './dialogs/StandardDialog.svelte';
  import StandardButton from './StandardButton.svelte';

  let isOpen = !get(hasSeenRedirectToOtherVersionDialog);

  const redirectToOtherVersion = () => {
    hasSeenRedirectToOtherVersionDialog.set(true);
    window.location.href = 'https://ml.microbit.org';
  };

  const onClose = () => {
    hasSeenRedirectToOtherVersionDialog.set(true);
    isOpen = false;
  };
</script>

<StandardDialog
  {isOpen}
  hasCloseButton={false}
  closeOnOutsideClick={false}
  closeOnEscape={false}
  class="w-110 space-y-5"
  {onClose}>
  <svelte:fragment slot="heading">
    {$t('popup.redirectToOtherVersion.header')}
  </svelte:fragment>
  <svelte:fragment slot="body">
    <div class="space-y-8">
      <p>{$t('popup.redirectToOtherVersion.explain')}</p>
      <div class="flex flex-col justify-end space-y-3">
        <StandardButton
          type="primary"
          size="normal"
          class="w-sm"
          onClick={redirectToOtherVersion}
          >{$t('popup.redirectToOtherVersion.button.redirect')}</StandardButton>
        <StandardButton onClick={onClose} type="secondary" size="normal" class="w-sm"
          >{$t('popup.redirectToOtherVersion.button.stay')}</StandardButton>
      </div>
      <p class="text-sm">{$t('popup.redirectToOtherVersion.uk')}</p>
    </div>
  </svelte:fragment>
</StandardDialog>
