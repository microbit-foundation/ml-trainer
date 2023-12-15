<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { createMenu } from 'svelte-headlessui';

  export let menu: ReturnType<typeof createMenu>;
  export let value: any;
</script>

<button
  use:menu.item={{ value }}
  {...$$restProps}
  class="group flex gap-2 items-center w-full px-4 py-2 text-sm text-black"
  class:bg-gray-100={$menu.active === value}>
  <slot />
</button>
