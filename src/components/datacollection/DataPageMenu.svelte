<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../../i18n';
  import ClearIcon from 'virtual:icons/ri/delete-bin-2-line';
  import UploadIcon from 'virtual:icons/ri/upload-2-line';
  import DownloadIcon from 'virtual:icons/ri/download-2-line';
  import MeltMenuItems from '../control-bar/control-bar-items/MeltMenuItems.svelte';
  import MeltMenuItem from '../control-bar/control-bar-items/MeltMenuItem.svelte';
  import IconButton from '../IconButton.svelte';
  import MoreIcon from 'virtual:icons/mdi/dots-vertical';
  import { createDropdownMenu } from '@melt-ui/svelte';

  export let downloadDisabled = false;
  export let clearDisabled = false;
  export let onClearGestures: () => void;
  export let onDownloadGestures: () => void;
  export let onUploadGestures: () => void;

  const menu = createDropdownMenu({ forceVisible: true });
  const { trigger } = menu.elements;
  const { open } = menu.states;
</script>

<div class="relative inline-block leading-none">
  <IconButton
    ariaLabel={$t('content.data.controlbar.button.menu')}
    rounded
    {...$trigger}
    useAction={trigger}>
    <MoreIcon
      class="h-12 w-12 text-brand-500 flex justify-center items-center rounded-full" />
  </IconButton>
  {#if $open}
    <MeltMenuItems class="w-max" {menu}>
      <div class="py-2">
        <MeltMenuItem {menu} on:m-click={onUploadGestures}>
          <UploadIcon />
          {$t('content.data.controlbar.button.uploadData')}
        </MeltMenuItem>
        <MeltMenuItem {menu} on:m-click={onDownloadGestures} disabled={downloadDisabled}>
          <DownloadIcon />
          {$t('content.data.controlbar.button.downloadData')}
        </MeltMenuItem>
        <MeltMenuItem {menu} on:m-click={onClearGestures} disabled={clearDisabled}>
          <ClearIcon />
          {$t('content.data.controlbar.button.clearData')}
        </MeltMenuItem>
      </div>
    </MeltMenuItems>
  {/if}
</div>
