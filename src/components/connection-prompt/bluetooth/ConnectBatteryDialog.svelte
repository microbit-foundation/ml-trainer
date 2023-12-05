<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardButton from '../../StandardButton.svelte';
  import { t } from '../../../i18n';
  import microbitConnectedImage from '../../../imgs/stylised-microbit-connected.svg';

  export let onNextClick: () => void;
  export let onBackClick: () => void;
</script>

<main>
  <div class="w-180 leading-10 pb-5">
    <p class="font-bold text-2xl text-left pb-3">
      {$t('connectMB.connectBattery.heading')}
    </p>
    <p>{$t('connectMB.connectBattery.subtitle')}</p>
    <img
      src={microbitConnectedImage}
      alt="Battery connection diagram"
      class="px-40 pt-5" />
  </div>
  <div class="justify-end gap-x-5 flex pt-10">
    <StandardButton outlined={true} onClick={onBackClick}
      >{$t('connectMB.backButton')}</StandardButton>
    <StandardButton onClick={onNextClick}>{$t('connectMB.nextButton')}</StandardButton>
  </div>
</main>
