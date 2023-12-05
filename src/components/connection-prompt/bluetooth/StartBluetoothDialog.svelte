<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardButton from '../../StandardButton.svelte';
  import { t } from '../../../i18n';
  import microbitImage from '../../../imgs/stylised-microbit-black.svg';

  export let onNextClick: () => void;
  export let onStartRadioClick: () => void;
</script>

<main>
  <div class="w-200">
    <h1 class="text-2xl font-bold pb-5">{$t('connectMB.bluetoothStart.heading')}</h1>
    <p>{$t('connectMB.bluetoothStart.subtitle')}</p>
    <div class="inline-grid grid-cols-3 gap-30 py-20 px-10">
      <div>
        <img src={microbitImage} alt="radio ingredients" />
        <p class="pt-10 text-center font-bold">
          {$t('connectMB.bluetoothStart.requirements1')}
        </p>
      </div>
      <div>
        <img src="" alt="PLACEHOLDER" />
        <p class="pt-10 text-center font-bold">
          {$t('connectMB.bluetoothStart.requirements2')}
        </p>
      </div>
      <div>
        <img src="" alt="PLACEHOLDER" />
        <p class="pt-10 text-center font-bold">
          {$t('connectMB.bluetoothStart.requirements3')}
        </p>
      </div>
    </div>
  </div>
  <div class="flex items-center w-full">
    <div on:click={onStartRadioClick} class="w-min-60 align-bottom hover:cursor-pointer">
      {$t('connectMB.bluetoothStart.switchRadio')}
    </div>
    <StandardButton extraClasses="basis-full" position="right" onClick={onNextClick}
      >{$t('connectMB.nextButton')}</StandardButton>
  </div>
</main>
