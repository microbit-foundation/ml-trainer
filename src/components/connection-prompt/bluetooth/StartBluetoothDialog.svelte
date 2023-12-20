<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardButton from '../../StandardButton.svelte';
  import { t } from '../../../i18n';
  import microbitImage from '../../../imgs/stylised-microbit-black.svg';
  import computerImage from '../../../imgs/stylised_computer.svg';
  import usbCableImage from '../../../imgs/stylised-usb-cable.svg';
  import batteryPackImage from '../../../imgs/stylised-battery-pack.svg';

  export let onNextClick: () => void;
  export let onStartRadioClick: () => void;

  const imageHeight = 25;
</script>

<main>
  <div class="w-200">
    <h1 class="text-2xl font-bold pb-5">{$t('connectMB.bluetoothStart.heading')}</h1>
    <p>{$t('connectMB.bluetoothStart.subtitle')}</p>
    <div class="inline-grid grid-cols-4 gap-20 py-20 px-10">
      <div class="flex flex-col">
        <img
          class="h-{imageHeight}"
          src={microbitImage}
          alt={$t('connectMB.bluetoothStart.requirements1')} />
        <p class="pt-10 text-center font-bold">
          {$t('connectMB.bluetoothStart.requirements1')}
        </p>
      </div>
      <div class="flex flex-col">
        <img
          class="h-{imageHeight}"
          src={computerImage}
          alt={$t('connectMB.bluetoothStart.requirements2')} />
        <p class="pt-10 text-center font-bold">
          {$t('connectMB.bluetoothStart.requirements2')}
        </p>
      </div>
      <div class="flex flex-col">
        <img
          class="h-{imageHeight}"
          src={usbCableImage}
          alt={$t('connectMB.bluetoothStart.requirements3')} />
        <p class="pt-10 text-center font-bold">
          {$t('connectMB.bluetoothStart.requirements3')}
        </p>
      </div>
      <div class="flex flex-col">
        <img
          class="h-{imageHeight}"
          src={batteryPackImage}
          alt={$t('connectMB.bluetoothStart.requirements4')} />
        <p class="pt-10 text-center font-bold">
          {$t('connectMB.bluetoothStart.requirements4')}
        </p>
      </div>
    </div>
  </div>
  <div class="flex items-center w-full">
    <div
      on:click={onStartRadioClick}
      class="w-full align-bottom hover:cursor-pointer text-link">
      {$t('connectMB.bluetoothStart.switchRadio')}
    </div>
    <StandardButton
      extraClasses="basis-full"
      position="right"
      onClick={onNextClick}
      type="primary">{$t('connectMB.nextButton')}</StandardButton>
  </div>
</main>
