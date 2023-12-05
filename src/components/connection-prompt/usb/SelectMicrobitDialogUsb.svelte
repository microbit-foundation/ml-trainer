<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardButton from '../../StandardButton.svelte';
  import { t } from '../../../i18n';
  import Microbits from '../../../script/microbit-interfacing/Microbits';
  import selectMicrobitImage from '../../../imgs/select-microbit.png';

  export let onBackClick: () => void;
  export let onFound: () => void;
  export let onLinkError: () => void;

  function onNextClick() {
    Microbits.linkMicrobit()
      .then(() => onFound())
      .catch((e: Error) => {
        console.log(e);
        onLinkError();
      });
  }
</script>

<main>
  <div class="w-180 leading-10 pb-5">
    <p class="font-bold text-2xl text-left">
      {$t('connectMB.webPopup')}
    </p>
    <img
      src={selectMicrobitImage}
      alt="Instructions on how to choose microbit from web popup using usb"
      class="left-0 pt-5" />
    <p class="absolute left-3/4 transform -translate-x-1/2 top-1/2 -translate-y-28">
      {$t('connectMB.webPopup.instruction1')}
    </p>
    <p class="absolute left-3/4 transform -translate-x-1/2 -translate-y-13">
      {$t('connectMB.webPopup.instruction2')}
    </p>
  </div>
  <div class="justify-end flex flex-space-10 gap-x-5">
    <StandardButton outlined={true} position="right" onClick={onBackClick}
      >{$t('connectMB.backButton')}</StandardButton>
    <StandardButton onClick={onNextClick}>{$t('connectMB.nextButton')}</StandardButton>
  </div>
</main>
