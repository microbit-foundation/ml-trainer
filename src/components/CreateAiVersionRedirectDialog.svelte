<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../i18n';
  import StandardDialog from './dialogs/StandardDialog.svelte';
  import StandardButton from './StandardButton.svelte';
  import createAiTestingPage from '../imgs/createai_testing_page.png';
  import { initialShowConsent } from '../script/stores/complianceStore';

  let isOpen = true;

  const createAIVersionRedirect = () => {
    window.location.href = 'https://createai.microbit.org/';
  };

  const onClose = () => {
    isOpen = false;
    initialShowConsent();
  };
</script>

<StandardDialog
  {isOpen}
  hasCloseButton
  closeOnOutsideClick={false}
  closeOnEscape={false}
  class="w-110 space-y-5"
  {onClose}>
  <svelte:fragment slot="heading">
    {$t('popup.createAIVersionRedirect.header')}
  </svelte:fragment>
  <svelte:fragment slot="body">
    <div class="space-y-5">
      <img src={createAiTestingPage} alt="" />
      <div class="space-y-2">
        <p>{$t('popup.createAIVersionRedirect.explain1')}</p>
        <p>{$t('popup.createAIVersionRedirect.explain2')}</p>
      </div>
      <div class="flex flex-col justify-end space-y-2">
        <StandardButton
          type="primary"
          size="normal"
          class="w-170px"
          onClick={createAIVersionRedirect}
          >{$t('popup.createAIVersionRedirect.button.redirect')}</StandardButton>
        <StandardButton onClick={onClose} type="secondary" size="normal" class="w-170px"
          >{$t('popup.createAIVersionRedirect.button.stay')}</StandardButton>
      </div>
    </div>
  </svelte:fragment>
</StandardDialog>
