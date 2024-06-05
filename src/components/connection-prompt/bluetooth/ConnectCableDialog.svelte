<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import StandardButton from '../../StandardButton.svelte';
  import { t } from '../../../i18n';
  import connectCableImage from '../../../imgs/connect-cable.gif';
  import DialogHeading from '../../DialogHeading.svelte';

  export let titleId: string;
  export let subtitleId: string;
  export let onNextClick: () => void;
  export let onBackClick: (() => void) | undefined = undefined;
  export let onSkipClick: (() => void) | undefined = undefined;
  export let onAltClick: (() => void) | undefined = undefined;
  export let altClickId: string | undefined = undefined;
</script>

<div class="w-175">
  <DialogHeading>
    {$t(titleId)}
  </DialogHeading>
  <div class="space-y-5">
    <p>
      {$t(subtitleId)}
    </p>
    <img
      src={connectCableImage}
      alt={$t('connectMB.connectCable.altText')}
      class="w-65 h-241px mx-auto" />
  </div>
</div>
<div class="flex justify-between pt-5">
  {#if onSkipClick}
    <StandardButton type="link" onClick={onSkipClick}
      >{$t('connectMB.connectCable.skip')}</StandardButton>
  {/if}
  {#if onAltClick && altClickId}
    <StandardButton type="link" onClick={onAltClick}>{$t(altClickId)}</StandardButton>
  {/if}
  <div class="flex gap-x-5 ml-auto">
    {#if onBackClick}
      <StandardButton onClick={onBackClick}>{$t('connectMB.backButton')}</StandardButton>
    {/if}
    <StandardButton type="primary" onClick={onNextClick}
      >{$t('connectMB.nextButton')}</StandardButton>
  </div>
</div>
