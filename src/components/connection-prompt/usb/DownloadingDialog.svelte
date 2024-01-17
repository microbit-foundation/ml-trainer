<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../../../i18n';
  import LoadingBar from '../../LoadingBar.svelte';
  export let currentStage: string;
  export let transferProgress: number;
</script>

<div class="w-600px text-left">
  <h1 class="font-bold mb-5 text-2xl">
    {#if currentStage === 'usb'}
      {$t('connectMB.usbDownloading.header')}
    {:else if currentStage === 'usb1'}
      {$t('connectMB.usbDownloadingMB1.header')}
    {:else if currentStage === 'usb2'}
      {$t('connectMB.usbDownloadingMB2.header')}
    {/if}
  </h1>
  <p class="mb-2">
    {$t('connectMB.usbDownloading.subtitle')}
  </p>
  <div class="flex justify-center mb-2">
    <div class="flex-1 mr-2">
      <LoadingBar progress={transferProgress} />
    </div>
  </div>
</div>
