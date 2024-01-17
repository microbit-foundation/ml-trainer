<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import Menus, { MenuProperties } from '../script/navigation/Menus';
  import { get } from 'svelte/store';
  import { currentPath, navigate } from '../router/paths';
  import { t } from 'svelte-i18n';

  $: isSelected = (menuProps: MenuProperties) => {
    let path = $currentPath;
    if (menuProps.navigationPath === path) {
      return true;
    }
    return false;
  };
</script>

<div class="flex w-full justify-center bg-white border-b-3 border-gray-200">
  <div class="flex">
    {#each get(Menus.getMenuStore()) as menu}
      <a
        class="block cursor-pointer mx-4 min-w-8rem pb-2 pt-1 mt-1 px-12 border-b-4px border-b-white outline-none focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:ring-ring z-2"
        class:border-b-secondary={isSelected(menu)}
        class:opacity-55={!isSelected(menu)}
        href={menu.navigationPath}
        on:click|preventDefault={() => navigate(menu.navigationPath)}>
        <div class="h-full relative">
          <p class="text-lg font-bold text-center">
            {$t(menu.title)}
          </p>
        </div>
        <slot />
      </a>
    {/each}
  </div>
</div>
