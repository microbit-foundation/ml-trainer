<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../i18n';
  import { setAsSeenRedirectDialog } from '../script/stores/complianceStore';
  import StandardDialog from './dialogs/StandardDialog.svelte';
  import StandardButton from './StandardButton.svelte';

  export let isOpen: boolean;
  export let onClose: () => void;
  const redirectToNextGen = () => {
    setAsSeenRedirectDialog();
    window.location.href = 'https://www.ml.microbit.org';
  };
  const onButtonClose = () => {
    setAsSeenRedirectDialog();
    onClose();
  };
</script>

<StandardDialog
  hasCloseButton={false}
  {isOpen}
  class="w-100 space-y-5"
  onClose={onButtonClose}>
  <svelte:fragment slot="heading">
    {$t('popup.redirectToNextGen.header')}
  </svelte:fragment>
  <svelte:fragment slot="body">
    <div class="space-y-5">
      <p>{$t('popup.redirectToNextGen.explain')}</p>
      <div class="flex flex-col justify-end space-y-5">
        <StandardButton
          type="primary"
          size="normal"
          class="w-sm"
          onClick={redirectToNextGen}
          >{$t('popup.redirectToNextGen.button.redirect')}</StandardButton>
        <StandardButton
          onClick={onButtonClose}
          type="secondary"
          size="normal"
          class="w-sm">{$t('popup.redirectToNextGen.button.stay')}</StandardButton>
      </div>
    </div>
  </svelte:fragment>
</StandardDialog>
