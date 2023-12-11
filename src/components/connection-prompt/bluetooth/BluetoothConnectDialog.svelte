<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import PatternMatrix from '../../PatternMatrix.svelte';
  import { t } from '../../../i18n';
  import { DeviceRequestStates } from '../../../script/stores/connectDialogStore';
  import {
    btPatternInput,
    btPatternOutput,
  } from '../../../script/stores/connectionStore';
  import type { Writable } from 'svelte/store';
  import StandardButton from '../../StandardButton.svelte';

  // callbacks
  export let deviceState: DeviceRequestStates;
  export let onBackClick: () => void;
  export let onNextClick: () => void;

  let patternMatrixState: Writable<boolean[]> =
    deviceState === DeviceRequestStates.INPUT ? btPatternInput : btPatternOutput;
  let attemptedToPairWithInvalidPattern = false;

  function updateMatrix(matrix: boolean[]): void {
    $patternMatrixState = matrix;
    attemptedToPairWithInvalidPattern = false;
  }
</script>

<main class="w-180">
  <h1 class="mb-5 font-bold text-2xl justify-center">
    {$t('connectMB.pattern.heading')}
  </h1>
  <p>{$t('connectMB.pattern.subtitle')}</p>
  <div class="flex justify-center pt-20 pb-10">
    <PatternMatrix matrix={$patternMatrixState} onMatrixChange={updateMatrix} />
  </div>
  <div class="justify-end gap-x-5 flex pt-10">
    <StandardButton onClick={onBackClick}>{$t('connectMB.backButton')}</StandardButton>
    <StandardButton type="primary" onClick={onNextClick}
      >{$t('connectMB.nextButton')}</StandardButton>
  </div>
</main>
