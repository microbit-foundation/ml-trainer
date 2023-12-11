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
      alt="Showing the batteries need to go into the battery pack and the battery pack should be connected at the top left of the micro:bit."
      class="px-40 pt-5" />
  </div>
  <div class="justify-end gap-x-5 flex pt-10">
    <StandardButton onClick={onBackClick}>{$t('connectMB.backButton')}</StandardButton>
    <StandardButton type="primary" onClick={onNextClick}
      >{$t('connectMB.nextButton')}</StandardButton>
  </div>
</main>
