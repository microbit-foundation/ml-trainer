<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
-->

<script lang="ts" context="module">
  export type IconButtonVariant = 'ghost';
</script>

<script lang="ts">
  import type { Action } from 'svelte/action';

  export let type: IconButtonVariant = 'ghost';
  export let onClick: ((e: Event) => void) | undefined = undefined;
  export let disabled = false;
  export let ariaLabel: string;
  export let rounded: boolean = false;
  export let useAction: Action = () => {};
  let iconButton: undefined | HTMLElement;

  export const focus = () => {
    iconButton?.focus();
  };

  const classes = {
    ghost: {
      base: 'text-black',
      enabled: 'hover:bg-neutral-200 active:bg-neutral-300',
    },
  };
</script>

<button
  {disabled}
  class="{classes[type].base} {disabled
    ? ''
    : classes[type]
        .enabled} leading-0 outline-none disabled:opacity-60 transition-colors duration-200 focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:ring-ring"
  class:cursor-pointer={!disabled}
  class:cursor-default={disabled}
  class:rounded-full={rounded}
  class:rounded-md={!rounded}
  aria-label={ariaLabel}
  on:click={onClick}
  on:focus
  on:select
  use:useAction
  bind:this={iconButton}
  {...$$restProps}>
  <slot />
</button>
