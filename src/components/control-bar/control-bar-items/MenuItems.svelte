<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { createMenu } from 'svelte-headlessui';

  export let menu: ReturnType<typeof createMenu>;
</script>

<div
  use:menu.items
  class="z-999 absolute right-0 mt-3 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
  {...$$restProps}>
  <slot />
</div>
