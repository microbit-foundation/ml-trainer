<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
-->

<style>
  .large {
    font-size: 20px;
    padding: 16px 50px;
  }

  .normal {
    padding: 10px 35px;
  }

  .small {
    padding: 1px 10px;
  }
</style>

<script lang="ts" context="module">
  export type ButtonVariant = 'secondary' | 'primary' | 'warning' | 'link';
</script>

<script lang="ts">
  import LoadingSpinner from './LoadingSpinner.svelte';

  type ButtonSize = 'small' | 'normal' | 'large';

  export let type: ButtonVariant = 'secondary';
  export let onClick: ((e: Event) => void) | undefined = undefined;
  export let disabled = false;
  export let size: ButtonSize = 'normal';
  export let shadows = false;
  export let isLoading = false;

  const classes = {
    link: {
      base: 'text-link',
      enabled: '',
      loadingSpinner: 'text-secondary',
    },
    primary: {
      base: 'font-bold rounded-4xl bg-brand-500 text-white border-solid border-2 border-brand-500',
      enabled:
        'hover:bg-brand-600 hover:border-brand-600 active:bg-brand-700 active:border-brand-700',
      loadingSpinner: 'text-white',
    },
    secondary: {
      base: 'font-bold rounded-4xl bg-white text-brand-700 border-solid border-2 border-brand-500',
      enabled: 'hover:border-brand-600 active:border-brand-700 active:bg-brand-50',
      loadingSpinner: 'text-secondary',
    },
    warning: {
      base: 'font-bold rounded-4xl bg-red-600 text-white border-solid border-2 border-red-600',
      enabled:
        'hover:bg-red-700 hover:border-red-700 active:bg-red-800 active:border-red-800',
      loadingSpinner: 'text-white',
    },
  };
</script>

<div class="grid grid-cols-1 place-items-center">
  <button
    disabled={isLoading || disabled}
    class="{classes[type].base} {disabled
      ? ''
      : classes[type].enabled} outline-none disabled:opacity-60 {type === 'link'
      ? ''
      : size} transition-colors duration-200 focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:ring-ring"
    class:shadow-md={shadows}
    class:cursor-pointer={!disabled}
    class:cursor-default={disabled}
    on:click={onClick}>
    {#if isLoading}
      <LoadingSpinner size="5px" loaderClass={classes[type].loadingSpinner} />
    {:else}
      <slot />
    {/if}
  </button>
</div>
