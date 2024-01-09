<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../i18n';
  import DialogHeading from './DialogHeading.svelte';
  import StandardButton from './StandardButton.svelte';

  interface Item {
    imgSrc: string;
    imgAltId: string;
    titleId: string;
    subtitleId?: string;
  }

  export let items: Item[];
  export let headingId: string;
  export let subtitleId: string | undefined = undefined;
  export let switchTextId: string;
  export let onSwitchClick: () => void;
  export let onNextClick: () => void;
</script>

<main>
  <div class="w-175">
    <DialogHeading>{$t(headingId)}</DialogHeading>
    {#if subtitleId}
      <p>{$t(subtitleId)}</p>
    {/if}
    <div class="inline-grid grid-cols-{items.length} gap-16 py-13 px-10">
      {#each items as item}
        <div class="flex flex-col text-md text-center">
          <img class="h-25 w-107px" src={item.imgSrc} alt={$t(item.imgAltId)} />
          <p class="pt-10 font-bold">
            {$t(item.titleId)}
          </p>
          {#if item.subtitleId}
            <p>{$t(item.subtitleId)}</p>
          {/if}
        </div>
      {/each}
    </div>

    <div class="flex justify-between items-center">
      <StandardButton type="link" onClick={onSwitchClick}>
        {$t(switchTextId)}
      </StandardButton>
      <StandardButton onClick={onNextClick} type="primary"
        >{$t('connectMB.nextButton')}</StandardButton>
    </div>
  </div>
</main>
