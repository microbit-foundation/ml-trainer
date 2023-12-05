<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardButton from '../../StandardButton.svelte';
  import { t } from '../../../i18n';
  import connectCableImage from '../../../imgs/connect-cable.gif';

  export let onNextClick: () => void;
  export let onBackClick: () => void;
  export let onSkipClick: () => void;
</script>

<main>
  <div class="w-200 leading-10">
    <p class="font-bold text-2xl text-left pb-5">
      {$t('connectMB.connectCableMB1.heading')}
    </p>
    <p class="leading-normal">{$t('connectMB.connectCableMB1.subtitle')}</p>
    <img src={connectCableImage} alt="GIF of connecting micro:bit" class="px-55 py-5" />
  </div>
  <div class="flex">
    <p class="self-center w-full hover:cursor-pointer" on:click={onSkipClick}>
      Skip: program already downloaded?
    </p>
    <div class="flex w-full justify-end gap-x-5">
      <StandardButton outlined={true} onClick={onBackClick}
        >{$t('connectMB.backButton')}</StandardButton>
      <StandardButton onClick={onNextClick}>{$t('connectMB.nextButton')}</StandardButton>
    </div>
  </div>
</main>
