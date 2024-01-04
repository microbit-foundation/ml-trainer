<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { RecordingData } from '../script/stores/mlStore';
  import RecordingGraph from './graphs/RecordingGraph.svelte';
  import IconButton from './IconButton.svelte';
  import { t } from '../i18n';
  import CloseIcon from 'virtual:icons/ri/close-line';

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

<div class="h-26 w-40 pt-1 bg-white relative">
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

  <div class="absolute right-0 top-0 z-2">
    <IconButton ariaLabel={$t('content.data.deleteRecording')} onClick={deleteClicked}>
      <CloseIcon class="text-xl m-1" />
    </IconButton>
  </div>
</div>
