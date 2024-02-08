<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../i18n';
  import { state } from '../script/stores/uiStore';
  import DialogHeading from './DialogHeading.svelte';
  import StandardButton from './StandardButton.svelte';
  import ExternalLinkIcon from 'virtual:icons/ri/external-link-line';

  interface Item {
    imgSrc: string;
    titleId: string;
    subtitleId?: string;
  }

  export let items: Item[];
  export let headingId: string;
  export let subtitleId: string | undefined = undefined;
  export let switchTextId: string;
  export let onSwitchClick: (() => void) | undefined;
  export let onNextClick: () => void;
</script>

<div class="w-175">
  <DialogHeading>{$t(headingId)}</DialogHeading>
  <p>
    {#if $state.reconnectState.reconnectFailed}
      <span>{$t('reconnectFailed.subtitle')}</span>
    {/if}
    {#if subtitleId}
      {$t(subtitleId)}
    {/if}
  </p>
  <div class="inline-grid grid-cols-{items.length} gap-16 py-13 px-10">
    {#each items as item}
      <div class="flex flex-col text-md text-center">
        <img class="h-25 w-107px" src={item.imgSrc} alt="" />
        <p class="pt-10 font-bold">
          {$t(item.titleId)}
        </p>
        {#if item.subtitleId}
          <p>{$t(item.subtitleId)}</p>
        {/if}
      </div>
    {/each}
  </div>

  <div class="flex {onSwitchClick ? 'justify-between' : 'justify-end'} items-center">
    <div>
      {#if onSwitchClick}
        <StandardButton class="place-self-start" type="link" onClick={onSwitchClick}>
          {$t(switchTextId)}
        </StandardButton>
      {/if}
      {#if $state.reconnectState.reconnectFailed}
        <!-- TODO: actual support URL -->
        <a
          class="place-self-start text-link outline-none focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:ring-ring"
          href="https://support.microbit.org"
          target="_blank"
          rel="noopener">
          {$t('connectMB.troubleshoot')}
          <ExternalLinkIcon class="inline transform -translate-y-0.25" />
        </a>
      {/if}
    </div>
    <StandardButton onClick={onNextClick} type="primary"
      >{$t('connectMB.nextButton')}</StandardButton>
  </div>
</div>
