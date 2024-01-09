<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardButton from '../../StandardButton.svelte';
  import { t } from '../../../i18n';
  import Microbits from '../../../script/microbit-interfacing/Microbits';
  import selectMicrobitImage from '../../../imgs/select-microbit-web-usb.png';
  import DialogHeading from '../../DialogHeading.svelte';

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
  <div class="w-175">
    <DialogHeading>
      {$t('connectMB.webPopup')}
    </DialogHeading>
    <div class="flex">
      <img
        class="w-418px h-365px flex-shrink-0"
        src={selectMicrobitImage}
        alt={$t('connectMB.webPopup.webUsb.altText')} />
      <div class="flex-grow px-5">
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
  <div class="justify-end flex gap-x-5 pt-5">
    <StandardButton onClick={onBackClick}>{$t('connectMB.backButton')}</StandardButton>
    <StandardButton type="primary" onClick={onNextClick}
      >{$t('connectMB.nextButton')}</StandardButton>
  </div>
</main>
