<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import CloseIcon from 'virtual:icons/ri/close-line';
  import { t } from '../i18n';
  import type { RecordingData } from '../script/stores/mlStore';
  import Fingerprint from './Fingerprint.svelte';
  import RecordingGraph from './graphs/RecordingGraph.svelte';
  import IconButton from './IconButton.svelte';

  // get recording from mother prop
  export let recording: RecordingData;
  export let gestureName: string;
  export let gestureId: number;
  export let showFingerprint: boolean = false;
  export let onDelete: (gestureId: number, recording: RecordingData) => void;
  export let fullWidth: boolean = false;
  export let showProcessedData: boolean = false;
</script>

<div
  class="h-full flex w-40 relative overflow-hidden"
  class:w-40={!fullWidth}
  class:w-full={fullWidth}
  class:rounded-md={showFingerprint}
  class:border-1={showFingerprint}
  class:border-neutral-300={showFingerprint}>
  <RecordingGraph data={recording.data} showBorder={!showFingerprint} />
  {#if showFingerprint}
    <div class="transition-all duration-1000 w-0" class:w-160px={showProcessedData}>
      <Fingerprint recordingData={recording} />
    </div>
  {/if}

  <div class="absolute top-0 z-2 left-0">
    <IconButton
      ariaLabel={$t('content.data.deleteRecording')}
      onClick={() => onDelete(gestureId, recording)}
      on:focus>
      <CloseIcon class="text-xl m-1" />
    </IconButton>
  </div>
</div>
