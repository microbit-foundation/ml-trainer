<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../../i18n';
  import DialogHeading from '../DialogHeading.svelte';
  import StandardButton from '../StandardButton.svelte';

  export let onTryAgain: () => void;
  export let onCancel: () => void;
  export let reconnectRequired: boolean = false;
</script>

<div class="w-175">
  <DialogHeading>{$t('connectMB.usbTryAgain.heading')}</DialogHeading>
  <div class="space-y-5">
    {#if reconnectRequired}
      <p>{$t('connectMB.usb.error1')}</p>
      <p>{$t('connectMB.usb.error2')}</p>
    {:else}
      <p>{$t('connectMB.usbTryAgain.subtitle')}</p>
    {/if}
    <div class="flex justify-end gap-x-5">
      <StandardButton onClick={onCancel}>{$t('actions.cancel')}</StandardButton>
      <StandardButton type="primary" onClick={onTryAgain}
        >{$t('connectMB.tryAgain')}</StandardButton>
    </div>
  </div>
</div>
