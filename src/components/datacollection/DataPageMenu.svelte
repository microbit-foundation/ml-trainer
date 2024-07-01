<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->
<style>
  .data-table tr * {
    border: 1px solid;
    border-color: gray;
    padding: 8px;
  }
</style>

<script lang="ts">
  import { t } from '../../i18n';
  import ClearIcon from 'virtual:icons/ri/delete-bin-2-line';
  import UploadIcon from 'virtual:icons/ri/upload-2-line';
  import CollectIcon from 'virtual:icons/ri/clipboard-line';
  import DownloadIcon from 'virtual:icons/ri/download-2-line';
  import MenuItems from '../control-bar/control-bar-items/MenuItems.svelte';
  import MenuItem from '../control-bar/control-bar-items/MenuItem.svelte';
  import IconButton from '../IconButton.svelte';
  import MoreIcon from 'virtual:icons/mdi/dots-vertical';
  import { createDropdownMenu, melt } from '@melt-ui/svelte';
  import Microbits from '../../script/microbit-interfacing/Microbits';
  import StandardDialog from '../dialogs/StandardDialog.svelte';
  import LoadingAnimation from '../LoadingBlobs.svelte';
  import StandardButton from '../StandardButton.svelte';
  import { PersistantGestureData } from '../../script/domain/Gestures';
  import { importGestureData, appendGestureData } from '../../script/stores/mlStore';

  export let downloadDisabled = false;
  export let clearDisabled = false;
  export let onClearGestures: () => void;
  export let onDownloadGestures: () => void;
  export let onUploadGestures: () => void;
  export let onCollectDataInField: () => void;

  const menu = createDropdownMenu({ forceVisible: true });
  const { trigger, separator } = menu.elements;
  const { open } = menu.states;

  let showLoadingDialog = false;
  let logError = '';

  let showImportDataDialog = false;
  let importedData: PersistantGestureData[] = [];

  const importDataFromLog = async () => {
    try {
      showLoadingDialog = true;
      const data = await Microbits.getInputMicrobit()?.getLogData();
      if (data) {
        importedData = data;
        showLoadingDialog = false;
        showImportDataDialog = true;
      } else {
        throw new Error('Data log is empty');
      }
    } catch (err) {
      logError = err as string;
    }
  };

  const closeImportDataDialog = () => {
    importedData = [];
    showImportDataDialog = false;
  };

  const overwriteExistingRecordings = () => {
    importGestureData(importedData);
    closeImportDataDialog();
  };

  const addToExistingRecordings = () => {
    appendGestureData(importedData);
    closeImportDataDialog();
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

<StandardDialog isOpen={showImportDataDialog} onClose={() => {}} class="w-150 space-y-5">
  <svelte:fragment slot="heading">Imported data</svelte:fragment>
  <svelte:fragment slot="body">
    <table class="data-table">
      <thead>
        <tr>
          <th>Action name</th>
          <th>Number of recordings</th>
        </tr>
      </thead>
      <tbody>
        {#each importedData as gesture}
          <tr>
            <td>
              {gesture.name}
            </td>
            <td>
              {gesture.recordings.length}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    <p>Do you want to add to or overwrite your existing action data?</p>
    <div class="flex items-center justify-end gap-x-5">
      <StandardButton type="secondary" onClick={overwriteExistingRecordings}
        >Overwrite</StandardButton>
      <StandardButton type="primary" onClick={addToExistingRecordings}
        >Add</StandardButton>
    </div>
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
        <MenuItem {menu} on:m-click={onCollectDataInField}>
          <CollectIcon />
          {$t('content.data.controlbar.button.collectDataInField')}
        </MenuItem>
        <MenuItem {menu} on:m-click={importDataFromLog}>
          <UploadIcon />
          Import from data log
        </MenuItem>
        <div class="m-5px h-1px bg-gray-300" use:separator {...$separator}></div>
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
      </div>
    </MenuItems>
  {/if}
</div>
