<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../i18n';
  import StandardDialog from './dialogs/StandardDialog.svelte';
  import StandardButton from './StandardButton.svelte';

  export let isOpen: boolean;
  export let onClose: () => void;
</script>

<StandardDialog {isOpen} {onClose} class="w-100 space-y-5">
  <svelte:fragment slot="heading">
    {$t('popup.redirectToNextGen.header')}
  </svelte:fragment>
  <svelte:fragment slot="body">
    <div class="space-y-5">
      <p>{$t('popup.redirectToNextGen.explain')}</p>
      <div class="flex flex-col justify-end space-y-5">
        <a href="https://ml.microbit.org">
          <StandardButton type="primary" size="normal" class="w-sm"
            >{$t('popup.redirectToNextGen.button.redirect')}</StandardButton>
        </a>
        <StandardButton onClick={onClose} type="secondary" size="normal" class="w-sm"
          >{$t('popup.redirectToNextGen.button.stay')}</StandardButton>
      </div>
    </div>
  </svelte:fragment>
</StandardDialog>
