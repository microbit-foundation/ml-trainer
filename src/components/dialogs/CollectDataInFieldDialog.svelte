<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->
<script lang="ts" context="module">
  export type Status = 'ready' | 'not ready';
</script>

<script lang="ts">
  import Gesture from '../../script/domain/Gesture';
  import MicrobitConnection from '../../script/microbit-interfacing/MicrobitConnection';
  import Microbits from '../../script/microbit-interfacing/Microbits';
  import { gestures } from '../../script/stores/Stores';
  import { isFieldDataCollectionMode } from '../../script/stores/uiStore';
  import LoadingSpinner from '../LoadingSpinner.svelte';
  import StandardButton from '../StandardButton.svelte';
  import StandardDialog from './StandardDialog.svelte';

  export let isOpen: boolean;
  export let onClose: () => void;
  export let status: Status;

  const encodeMatrix = (matrix: boolean[]) => {
    const binaryStr = matrix.map(b => (b ? 1 : 0)).join('');
    return binaryStr;
    // TODO: encode led matrix as hexadecimals
    return parseInt(binaryStr, 2).toString(16);
  };

  const splitIntoChunks = (a: string, chunkSize: number) => {
    const result = [];
    for (let i = 0; i < a.length; i += chunkSize) {
      result.push(a.slice(i, i + chunkSize));
    }
    return result;
  };

  const sendGestureDataToMicrobit = (mconn: MicrobitConnection, gs: Gesture[]) => {
    const message = gs
      .map(g => `${g.getName()},${encodeMatrix(g.getMatrix())}`)
      .join(';');
    splitIntoChunks(message, 17).forEach(c => mconn.sendToInputUart('f', c));
    // Signal end of message
    mconn.sendToInputUart('f', 'end');
  };

  let isLoading = false;

  const startCollectDataInField = async () => {
    isLoading = true;
    const inputMicrobit = Microbits.getInputMicrobit();
    if (inputMicrobit === undefined) {
      // This is not possible since validation happens in the parent component
      console.log('Error: No input micro:bit');
      return;
    }
    const gs = gestures.getGestures();
    sendGestureDataToMicrobit(inputMicrobit, gs);
  };

  $: if ($isFieldDataCollectionMode) {
    isLoading = false;
  }
</script>

<!-- Collect data in field dialog -->
<StandardDialog
  isOpen={isOpen && status === 'ready'}
  {onClose}
  class="flex flex-col gap-8 w-120">
  <svelte:fragment slot="heading">Collect data in the field</svelte:fragment>
  <svelte:fragment slot="body">
    <div class="flex flex-col space-y-3 self-center items-center justify-center">
      <div class="flex flex-col items-left h-100px">
        To collect data:
        <li>Press button A or B to page through the actions.</li>
        <li>Press button A and B to record gesture.</li>
        <li>
          Press the micro:bit logo and reconnect micro:bit to get log from the field.
        </li>
      </div>
    </div>
    <div class="flex flex-row space-x-3 self-center items-center justify-center">
      <StandardButton
        type="primary"
        onClick={startCollectDataInField}
        disabled={$isFieldDataCollectionMode || isLoading}>
        {#if isLoading}
          <LoadingSpinner />
        {:else}
          Start field data collection
        {/if}
      </StandardButton>
    </div>
  </svelte:fragment>
</StandardDialog>

<!-- Unable to collect data in field dialog -->
<StandardDialog
  isOpen={isOpen && status === 'not ready'}
  {onClose}
  class="flex flex-col gap-8 w-120">
  <svelte:fragment slot="heading">Unable to collect data in the field</svelte:fragment>
  <svelte:fragment slot="body">
    <div class="flex flex-col space-y-2 self-center items-left justify-left">
      <div class="flex flex-col items-left">
        Please ensure that:
        <li>your micro:bit is connected with the tool.</li>
        <li>at least two gestures are defined with LED patterns.</li>
      </div>
    </div>
    <div class="flex flex-row space-x-3 self-center items-center justify-center">
      <StandardButton type="secondary" onClick={onClose}>Okay</StandardButton>
    </div>
  </svelte:fragment>
</StandardDialog>
