<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../i18n';
  import StandardDialog from './dialogs/StandardDialog.svelte';
  import StandardButton from './StandardButton.svelte';
  import { isCompatibilityWarningDialogOpen } from '../script/stores/uiStore';
  import DialogHeading from './DialogHeading.svelte';

  const onClose = () => {
    $isCompatibilityWarningDialogOpen = false;
  };
</script>

<StandardDialog isOpen={$isCompatibilityWarningDialogOpen} {onClose}>
  <div class="w-175">
    <DialogHeading>
      {$t('popup.compatibility.header')}
    </DialogHeading>
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
  </div>
</StandardDialog>
