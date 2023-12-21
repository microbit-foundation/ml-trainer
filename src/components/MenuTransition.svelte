<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import Transition from 'svelte-transition';
  export let show: boolean;
</script>

<Transition
  {show}
  enter="transition ease-out duration-200"
  enterFrom="transform opacity-0 scale-80"
  enterTo="transform opacity-100 scale-100"
  leave="transition ease-in duration-75"
  leaveFrom="transform opacity-100 scale-100"
  leaveTo="transform opacity-0 scale-80">
  <slot />
</Transition>
