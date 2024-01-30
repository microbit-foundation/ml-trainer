<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardButton from '../../StandardButton.svelte';
  import { t } from '../../../i18n';
  import Microbits from '../../../script/microbit-interfacing/Microbits';

  export let onFoundUsb: () => void;
  export let onUsbLinkError: () => void;

  function onFindUsbClick() {
    Microbits.linkMicrobit()
      .then(() => onFoundUsb())
      .catch((e: Error) => {
        console.log(e);
        onUsbLinkError();
      });
  }

  let step = 1;
</script>

<div class="w-500px text-center">
  <h1 class="font-bold mb-5">
    {$t('connectMB.usb.header')}
  </h1>
</div>
<div>
  <div class="mb-5">
    {#if step === 1}
      <p>
        {$t('connectMB.usb.body1')}
      </p>
    {/if}
    {#if step === 2}
      <p>
        {$t('connectMB.usb.body2')}
      </p>
    {/if}
  </div>
  <StandardButton
    onClick={step === 2
      ? onFindUsbClick
      : () => {
          step = 2;
        }}>
    {$t(step === 1 ? 'connectMB.usb.button1' : 'connectMB.usb.button2')}
  </StandardButton>
</div>
