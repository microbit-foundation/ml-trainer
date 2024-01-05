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
  import DialogHeading from '../../DialogHeading.svelte';

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

<main class="w-175">
  <DialogHeading>
    {$t('connectMB.pattern.heading')}
  </DialogHeading>
  <p>{$t('connectMB.pattern.subtitle')}</p>
  <div class="flex justify-center p-20">
    <PatternMatrix matrix={$patternMatrixState} onMatrixChange={updateMatrix} />
  </div>
  <div class="flex justify-end gap-x-5">
    <StandardButton onClick={onBackClick}>{$t('connectMB.backButton')}</StandardButton>
    <StandardButton type="primary" onClick={onNextClick}
      >{$t('connectMB.nextButton')}</StandardButton>
  </div>
</main>
