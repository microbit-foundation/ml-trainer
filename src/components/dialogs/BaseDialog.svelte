<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { fly } from 'svelte/transition';

  export let isOpen: boolean;
  export let onClose: () => void;
  export let background: 'light' | 'dark' = 'dark';

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }

  let backgroundClasses: string;
  if (background === 'light') {
    backgroundClasses = ' bg-white/80 bg-blend-lighten';
  } else {
    backgroundClasses = 'bg-black/50 bg-blend-darken';
  }
</script>

<svelte:window on:keydown={handleKeyPress} />

{#if isOpen}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    transition:fly
    class="
      z-10000
      fixed
      top-0
      left-0
      h-screen
      w-screen
      flex
      justify-center
      items-center
      {backgroundClasses}
    "
    on:click={onClose}>
    <slot />
  </div>
{/if}
