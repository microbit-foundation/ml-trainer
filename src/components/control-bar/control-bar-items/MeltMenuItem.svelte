<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<style lang="postcss">
  .item[data-highlighted] {
    @apply bg-gray-100;
  }
  .item[data-disabled='true'] {
    @apply opacity-50;
  }
</style>

<script lang="ts">
  import { createDropdownMenu } from '@melt-ui/svelte';
  export let menu: ReturnType<typeof createDropdownMenu>;
  const { item } = menu.elements;
  export let disabled: boolean = false;
</script>

<div
  {...$item}
  use:item
  data-disabled={disabled}
  on:m-click
  class="group flex gap-2 items-center w-full px-4 py-2 text-neutral-800 item">
  <slot />
</div>
