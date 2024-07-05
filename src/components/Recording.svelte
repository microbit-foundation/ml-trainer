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
  export let showFingerprint: boolean = false;
  export let onDelete: ((recording: RecordingData) => void) | undefined = undefined;
</script>

<div class="h-full flex flex-col w-40 relative overflow-hidden gap-2">
  <RecordingGraph data={recording.data} />
  {#if showFingerprint}
    <div class="flex-grow">
      <Fingerprint {gestureName} recordingData={recording} height="half" />
    </div>
  {/if}

  {#if onDelete}
    <div class="absolute right-0 top-0 z-2">
      <IconButton
        ariaLabel={$t('content.data.deleteRecording')}
        onClick={() => onDelete && onDelete(recording)}
        on:focus>
        <CloseIcon class="text-xl m-1" />
      </IconButton>
    </div>
  {/if}
</div>
