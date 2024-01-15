<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../../i18n';
  import { createMenu } from 'svelte-headlessui';
  import ClearIcon from 'virtual:icons/ri/delete-bin-2-line';
  import UploadIcon from 'virtual:icons/ri/upload-2-line';
  import DownloadIcon from 'virtual:icons/ri/download-2-line';
  import MenuItems from '../control-bar/control-bar-items/MenuItems.svelte';
  import MenuItem from '../control-bar/control-bar-items/MenuItem.svelte';
  import MenuTransition from '../MenuTransition.svelte';
  import IconButton from '../IconButton.svelte';
  import MoreIcon from 'virtual:icons/mdi/dots-vertical';

  export let downloadDisabled = false;
  export let clearDisabled = false;
  export let onClearGestures: () => void;
  export let onDownloadGestures: () => void;
  export let onUploadGestures: () => void;

  const menu = createMenu({ label: $t('dataMenu.label') });

  const onSelect = (event: Event) => {
    const { selected } = (event as CustomEvent).detail;
    switch (selected) {
      case 'upload': {
        onUploadGestures();
        break;
      }
      case 'download': {
        onDownloadGestures();
        break;
      }
      case 'clear': {
        onClearGestures();
        break;
      }
    }
    menu.set({ selected: null });
  };
</script>

<div class="relative inline-block leading-none">
  <IconButton
    ariaLabel={$t('content.data.controlbar.button.menu')}
    rounded
    useAction={menu.button}
    on:select={onSelect}>
    <MoreIcon
      class="h-12 w-12 text-brand-500 flex justify-center items-center rounded-full" />
  </IconButton>
  <MenuTransition show={$menu.expanded}>
    <MenuItems class="w-max" {menu}>
      <div class="py-2">
        <MenuItem {menu} value="upload">
          <UploadIcon />
          {$t('content.data.controlbar.button.uploadData')}
        </MenuItem>
        <MenuItem {menu} disabled={downloadDisabled} value="download">
          <DownloadIcon />
          {$t('content.data.controlbar.button.downloadData')}
        </MenuItem>
        <MenuItem {menu} disabled={clearDisabled} value="clear">
          <ClearIcon />
          {$t('content.data.controlbar.button.clearData')}
        </MenuItem>
      </div>
    </MenuItems></MenuTransition>
</div>
