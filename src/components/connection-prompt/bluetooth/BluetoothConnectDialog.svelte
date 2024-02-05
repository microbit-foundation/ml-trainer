<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import PatternMatrix from '../../PatternMatrix.svelte';
  import { t } from '../../../i18n';
  import {
    btPatternInput,
    btPatternOutput,
    isInputPatternValid,
  } from '../../../script/stores/connectionStore';
  import type { Writable } from 'svelte/store';
  import StandardButton from '../../StandardButton.svelte';
  import DialogHeading from '../../DialogHeading.svelte';
  import { DeviceRequestStates } from '../../../script/microbit-interfacing/MicrobitConnection';

  // callbacks
  export let deviceState: DeviceRequestStates;
  export let onBackClick: () => void;
  export let onNextClick: () => void;

  let patternMatrixState: Writable<boolean[]> =
    deviceState === DeviceRequestStates.INPUT ? btPatternInput : btPatternOutput;
  let attemptedToPairWithInvalidPattern = false;

  const handleNextClick = () => {
    if (!isInputPatternValid()) {
      attemptedToPairWithInvalidPattern = true;
      return;
    }
    onNextClick();
  };

  const handleBackClick = () => {
    attemptedToPairWithInvalidPattern = false;
    onBackClick();
  };

  function updateMatrix(matrix: boolean[]): void {
    $patternMatrixState = matrix;
    attemptedToPairWithInvalidPattern = false;
  }
</script>

<div class="w-175">
  <DialogHeading>
    {$t('connectMB.pattern.heading')}
  </DialogHeading>
  <p>{$t('connectMB.pattern.subtitle')}</p>
  <div class="pt-20 pb-10">
    <div class="flex justify-center">
      <PatternMatrix
        matrix={$patternMatrixState}
        onMatrixChange={updateMatrix}
        invalid={attemptedToPairWithInvalidPattern} />
    </div>
    <p
      class="mt-15 text-red-600 text-center {attemptedToPairWithInvalidPattern
        ? 'visible'
        : 'invisible'}"
      role={attemptedToPairWithInvalidPattern ? 'alert' : null}>
      {$t('connectMB.bluetooth.invalidPattern')}
    </p>
  </div>
  <div class="flex justify-end gap-x-5">
    <StandardButton onClick={handleBackClick}
      >{$t('connectMB.backButton')}</StandardButton>
    <StandardButton type="primary" onClick={handleNextClick}
      >{$t('connectMB.nextButton')}</StandardButton>
  </div>
</div>
