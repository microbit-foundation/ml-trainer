<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import Menus, { MenuProperties } from '../script/navigation/Menus';
  import MenuButton from '../menus/MenuButton.svelte';
  import { get } from 'svelte/store';
  import { currentPath, navigate } from '../router/paths';

  $: isSelected = (menuProps: MenuProperties) => {
    let path = $currentPath;
    if (menuProps.navigationPath === path) {
      return true;
    }
    if (menuProps.additionalExpandPaths === undefined) {
      return false;
    }
    return menuProps.additionalExpandPaths.includes(path);
  };
</script>

<div class="flex w-full justify-center bg-white border-b-3 border-gray-200">
  <div class="flex">
    {#each get(Menus.getMenuStore()) as menu, id}
      <MenuButton
        onClickFunction={() => {
          navigate(menu.navigationPath);
        }}
        title={menu.title}
        helpTitle={menu.infoBubbleTitle}
        helpDescription={menu.infoBubbleContent}
        isSelected={isSelected(menu)} />
    {/each}
  </div>
</div>
