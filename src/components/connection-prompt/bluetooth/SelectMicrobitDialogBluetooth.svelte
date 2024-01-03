<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardButton from '../../StandardButton.svelte';
  import selectMicrobitImage from '../../../imgs/select-microbit-bluetooth.png';
  import { t } from '../../../i18n';

  export let onBackClick: () => void;
  export let onNextClick: () => void;
</script>

<main>
  <div class="w-180 leading-10 pb-5">
    <h2 class="font-bold text-2xl">
      {$t('connectMB.webPopup')}
    </h2>
    <div class="flex mt-5">
      <img
        width="418px"
        src={selectMicrobitImage}
        alt="Screenshot of the browser window that will appear next.  Your connected micro:bit will be listed. Choose your micro:bit then select the Connect button." />
      <div class="flex flex-col w-full px-5">
        <h3 class="font-bold text-lg mb-5">
          {$t('connectMB.webPopup.instruction.heading')}:
        </h3>
        <ol class="list-decimal list-inside">
          <li>{$t('connectMB.webPopup.instruction1')}</li>
          <li>{$t('connectMB.webPopup.instruction2')}</li>
        </ol>
      </div>
    </div>
  </div>
  <div class="justify-end flex gap-x-5">
    <StandardButton onClick={onBackClick}>{$t('connectMB.backButton')}</StandardButton>
    <StandardButton type="primary" onClick={onNextClick}
      >{$t('connectMB.nextButton')}</StandardButton>
  </div>
</main>
