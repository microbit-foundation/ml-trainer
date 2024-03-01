<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../../i18n';
  import { hasSeenAppVersionRedirectDialog } from '../../script/stores/uiStore';
  import StandardDialog from './StandardDialog.svelte';
  import StandardButton from '../StandardButton.svelte';

  let isOpen = true;

  const appVersionRedirect = () => {
    hasSeenAppVersionRedirectDialog.set(true);
    window.location.href = 'https://ml.microbit.org/thenextgen/';
  };

  const onClose = () => {
    hasSeenAppVersionRedirectDialog.set(true);
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
    {$t('popup.appVersionRedirect.header')}
  </svelte:fragment>
  <svelte:fragment slot="body">
    <div class="space-y-8">
      <p>{$t('popup.appVersionRedirect.explain')}</p>
      <div class="flex flex-col justify-end space-y-3">
        <StandardButton
          type="primary"
          size="normal"
          class="w-sm"
          onClick={appVersionRedirect}
          >{$t('popup.appVersionRedirect.button.redirect')}</StandardButton>
        <StandardButton onClick={onClose} type="secondary" size="normal" class="w-sm"
          >{$t('popup.appVersionRedirect.button.stay')}</StandardButton>
      </div>
      <p class="text-sm">{$t('popup.appVersionRedirect.uk')}</p>
    </div>
  </svelte:fragment>
</StandardDialog>
