<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import type { RecordingData } from '../script/stores/mlStore';
  import RecordingGraph from './graphs/RecordingGraph.svelte';
  import IconButton from './IconButton.svelte';
  import { t } from '../i18n';
  import CloseIcon from 'virtual:icons/ri/close-line';

  // get recording from mother prop
  export let recording: RecordingData;
  export let onDelete: (recording: RecordingData) => void;
</script>

<div class="h-full w-40 relative">
  <RecordingGraph data={recording.data} />

  <div class="absolute right-0 top-0 z-2">
    <IconButton
      ariaLabel={$t('content.data.deleteRecording')}
      onClick={() => onDelete(recording)}
      on:focus>
      <CloseIcon class="text-xl m-1" />
    </IconButton>
  </div>
</div>
