<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { RecordingData } from '../script/stores/mlStore';
  import RecordingGraph from './graphs/RecordingGraph.svelte';

  // get recording from mother prop
  export let recording: RecordingData;
  export let onDelete: (recording: RecordingData) => void;

  let hide = false;

  // Method for propagating deletion of recording
  function deleteClicked() {
    if (hide) {
      return;
    }

    hide = true;
    setTimeout(() => {
      hide = false;
      onDelete(recording);
    }, 450);
  }
</script>

<div class="h-26 w-40 mr-3 pt-1 bg-white relative">
  {#if hide}
    <div
      transition:fade
      class="
          absolute
          h-26
          w-40
          bg-white
        " />
  {/if}

  <RecordingGraph data={recording.data} />

  <button class="absolute right-0px top-0px z-2" on:click={deleteClicked}>
    <i class="fa fa-times fa-lg text-gray-500" />
  </button>
</div>
