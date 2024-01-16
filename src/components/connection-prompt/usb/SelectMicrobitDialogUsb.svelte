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
  import ArrowOne from '../arrows/ArrowOne.svelte';
  import ArrowTwo from '../arrows/ArrowTwo.svelte';

  export let onBackClick: () => void;
  export let onFound: () => void;
  export let onLinkError: () => void;

  function onNextClick() {
    // FIXME: Microbits added to the global scope to be accessible from the browser console for debugging
    (globalThis as any).mb = Microbits;
    Microbits.linkMicrobit()
      .then(() => onFound())
      .catch((e: Error) => {
        console.log(e);
        onLinkError();
      });
  }
</script>

<div class="w-175">
  <DialogHeading>
    {$t('connectMB.webPopup')}
  </DialogHeading>
  <div class="flex relative">
    <img
      class="w-418px h-365px flex-shrink-0"
      src={selectMicrobitImage}
      alt={$t('connectMB.webPopup.webUsb.altText')} />
    <div class="flex-grow px-5">
      <h3 class="font-bold text-lg mb-5">
        {$t('connectMB.webPopup.instruction.heading')}:
      </h3>
      <ol class="absolute top-22 left-122 space-y-7">
        <li><span class="sr-only">1. </span>{$t('connectMB.webPopup.instruction1')}</li>
        <li>
          <span class="sr-only">2. </span>{$t('connectMB.webPopup.webUsb.instruction2')}
        </li>
      </ol>
    </div>
    <div class="absolute top-81px left-230px">
      <ArrowOne />
    </div>
    <div class="absolute top-123px left-256px">
      <ArrowTwo />
    </div>
  </div>
</div>
<div class="justify-end flex gap-x-5 pt-5">
  <StandardButton onClick={onBackClick}>{$t('connectMB.backButton')}</StandardButton>
  <StandardButton type="primary" onClick={onNextClick}
    >{$t('connectMB.nextButton')}</StandardButton>
</div>
