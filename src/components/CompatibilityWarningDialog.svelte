<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../i18n';
  import MeltDialog from './dialogs/MeltDialog.svelte';
  import StandardButton from './StandardButton.svelte';
  import { isCompatibilityWarningDialogOpen } from '../script/stores/uiStore';

  const onClose = () => {
    $isCompatibilityWarningDialogOpen = false;
  };
</script>

<MeltDialog
  isOpen={$isCompatibilityWarningDialogOpen}
  {onClose}
  class="w-175"
  title={$t('popup.compatibility.header')}>
  <div class="space-y-5">
    <div class="space-y-2">
      <p>{$t('popup.compatibility.explain')}</p>
      <p>{$t('popup.compatibility.advice')}</p>
    </div>
    <div class="flex justify-end">
      <StandardButton onClick={onClose} type="primary"
        >{$t('actions.close')}</StandardButton>
    </div>
  </div>
</MeltDialog>
