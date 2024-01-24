<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { createDropdownMenu, melt } from '@melt-ui/svelte';
  import { scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  export let menu: ReturnType<typeof createDropdownMenu>;
  const { menu: menuElement } = menu.elements;
</script>

<div
  use:melt={$menuElement}
  transition:scale={{
    duration: 200,
    start: 0.5,
    easing: quintOut,
  }}
  class="z-999 absolute right-0 mt-3 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none {$$restProps.class}">
  <slot />
</div>
