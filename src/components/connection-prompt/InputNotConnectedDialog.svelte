<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardButton from '../StandardButton.svelte';
  import { t } from '../../i18n';
  import DialogHeading from '../DialogHeading.svelte';

  export let onConnectInput: () => void;
  export let onCancel: () => void;
</script>

<div class="w-175">
  <DialogHeading>
    {$t('connectMB.inputNotConnected.header')}
  </DialogHeading>
  <div class="space-y-5">
    <p>{$t('connectMB.inputNotConnected.description')}</p>
    <div class="flex justify-end gap-x-5">
      <StandardButton onClick={onCancel}>{$t('actions.cancel')}</StandardButton>
      <StandardButton type="primary" onClick={onConnectInput}
        >{$t('connectMB.inputNotConnected.connect')}</StandardButton>
    </div>
  </div>
</div>
