<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<style lang="postcss">
  .item[data-highlighted] {
    @apply bg-gray-100;
  }
</style>

<script lang="ts">
  import { createDropdownMenu } from '@melt-ui/svelte';
  export let dropdownMenu: ReturnType<typeof createDropdownMenu>;
  const { item } = dropdownMenu.elements;
  export let value: any;
</script>

<button
  {...$item}
  use:item
  {value}
  on:m-click
  class="group flex gap-2 items-center w-full px-4 py-2 text-neutral-800 item">
  <slot />
</button>
