<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts" context="module">
  export type USBTryAgainType = 'replug microbit' | 'select microbit' | 'close tabs';
</script>

<script lang="ts">
  import { t } from '../../i18n';
  import DialogHeading from '../DialogHeading.svelte';
  import StandardButton from '../StandardButton.svelte';

  export let onTryAgain: () => void;
  export let onCancel: () => void;
  export let type: USBTryAgainType = 'replug microbit';
</script>

<div class="w-175">
  <DialogHeading>{$t('connectMB.usbTryAgain.heading')}</DialogHeading>
  <div class="space-y-5">
    {#if type === 'select microbit'}
      <p>{$t('connectMB.usbTryAgain.selectMicrobit')}</p>
    {:else if type === 'close tabs'}
      <p>{$t('connectMB.usbTryAgain.closeTabs1')}</p>
      <p>{$t('connectMB.usbTryAgain.closeTabs2')}</p>
    {:else}
      <p>{$t('connectMB.usbTryAgain.replugMicrobit1')}</p>

      <div>
        <p>{$t('connectMB.usbTryAgain.replugMicrobit2')}</p>
        <ul class="list-disc pl-10">
          <li><p>{$t('connectMB.usbTryAgain.replugMicrobit3')}</p></li>
          <li><p>{$t('connectMB.usbTryAgain.replugMicrobit4')}</p></li>
        </ul>
      </div>
      <ul></ul>
    {/if}
    <div class="flex justify-end gap-x-5">
      <StandardButton onClick={onCancel}>{$t('actions.cancel')}</StandardButton>
      <StandardButton type="primary" onClick={onTryAgain}
        >{$t('connectMB.tryAgain')}</StandardButton>
    </div>
  </div>
</div>
