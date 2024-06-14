<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../../i18n';
  import ClearIcon from 'virtual:icons/ri/delete-bin-2-line';
  import UploadIcon from 'virtual:icons/ri/upload-2-line';
  import DownloadIcon from 'virtual:icons/ri/download-2-line';
  import MenuItems from '../control-bar/control-bar-items/MenuItems.svelte';
  import MenuItem from '../control-bar/control-bar-items/MenuItem.svelte';
  import IconButton from '../IconButton.svelte';
  import MoreIcon from 'virtual:icons/mdi/dots-vertical';
  import { createDropdownMenu } from '@melt-ui/svelte';
  import Microbits from '../../script/microbit-interfacing/Microbits';
  import StandardDialog from '../dialogs/StandardDialog.svelte';
  import LoadingAnimation from '../LoadingBlobs.svelte';
  import StandardButton from '../StandardButton.svelte';

  export let downloadDisabled = false;
  export let clearDisabled = false;
  export let onClearGestures: () => void;
  export let onDownloadGestures: () => void;
  export let onUploadGestures: () => void;

  const menu = createDropdownMenu({ forceVisible: true });
  const { trigger } = menu.elements;
  const { open } = menu.states;

  let showLoadingDialog = false;
  let logError = '';

  const importDataFromLog = async () => {
    try {
      showLoadingDialog = true;
      await Microbits.getInputMicrobit()?.getLogData();
      showLoadingDialog = false;
    } catch (err) {
      logError = err as string;
    }
  };
</script>

<StandardDialog
  isOpen={showLoadingDialog}
  onClose={() => {}}
  closeOnEscape={false}
  closeOnOutsideClick={false}
  class="w-150 space-y-5">
  <svelte:fragment slot="heading">Reading data log</svelte:fragment>
  <svelte:fragment slot="body">
    {#if !logError}
      <div class="flex flex-col gap-5 justify-center items-center py-3">
        <p>Transfering data...</p>
        <LoadingAnimation />
      </div>
    {:else}
      <p>Something went wrong.</p>
      <p>{logError}</p>
      <div class="flex items-center justify-end">
        <StandardButton type="primary" onClick={() => (showLoadingDialog = false)}
          >Close</StandardButton>
      </div>
    {/if}
  </svelte:fragment>
</StandardDialog>

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
    <MenuItems class="w-max" {menu}>
      <div class="py-2">
        <MenuItem {menu} on:m-click={onUploadGestures}>
          <UploadIcon />
          {$t('content.data.controlbar.button.uploadData')}
        </MenuItem>
        <MenuItem {menu} on:m-click={onDownloadGestures} disabled={downloadDisabled}>
          <DownloadIcon />
          {$t('content.data.controlbar.button.downloadData')}
        </MenuItem>
        <MenuItem {menu} on:m-click={onClearGestures} disabled={clearDisabled}>
          <ClearIcon />
          {$t('content.data.controlbar.button.clearData')}
        </MenuItem>
        <MenuItem {menu} on:m-click={importDataFromLog}>
          <UploadIcon />
          Import from data log
        </MenuItem>
      </div>
    </MenuItems>
  {/if}
</div>
