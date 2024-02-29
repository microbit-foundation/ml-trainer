<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../i18n';
  import { tryLocalStorageGet, tryLocalStorageSet } from '../script/utils/local-storage';
  import StandardDialog from './dialogs/StandardDialog.svelte';
  import StandardButton from './StandardButton.svelte';

  const seenRedirectDialogKey = 'seenRedirectDialog';
  const seenRedirectDialogValue = 'true';

  const setAsSeenRedirectDialog = () => {
    tryLocalStorageSet(seenRedirectDialogKey, seenRedirectDialogValue);
  };

  const hasSeenRedirectDialog = () =>
    tryLocalStorageGet(seenRedirectDialogKey) === seenRedirectDialogValue;

  let isOpen = !hasSeenRedirectDialog();
  const redirectToNextGen = () => {
    setAsSeenRedirectDialog();
    window.location.href = 'https://ml.microbit.org';
  };
  const onClose = () => {
    setAsSeenRedirectDialog();
    isOpen = false;
  };
</script>

<StandardDialog
  {isOpen}
  hasCloseButton={false}
  closeOnOutsideClick={false}
  closeOnEscape={false}
  class="w-100 space-y-5"
  {onClose}>
  <svelte:fragment slot="heading">
    {$t('popup.redirectToNextGen.header')}
  </svelte:fragment>
  <svelte:fragment slot="body">
    <div class="space-y-8">
      <p>{$t('popup.redirectToNextGen.explain')}</p>
      <div class="flex flex-col justify-end space-y-3">
        <StandardButton
          type="primary"
          size="normal"
          class="w-sm"
          onClick={redirectToNextGen}
          >{$t('popup.redirectToNextGen.button.redirect')}</StandardButton>
        <StandardButton onClick={onClose} type="secondary" size="normal" class="w-sm"
          >{$t('popup.redirectToNextGen.button.stay')}</StandardButton>
      </div>
    </div>
  </svelte:fragment>
</StandardDialog>
