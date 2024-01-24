<!--
  (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<style>
  .overlay {
    position: static;
    &::before {
      content: '';
      cursor: inherit;
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 0;
      width: 100%;
      height: 100%;
    }
  }
</style>

<script lang="ts">
  import { PathType, Paths, navigate } from '../router/paths';
  export let onClickOrHrefOrPath: string | PathType | (() => void);

  const sharedClass = `overlay outline-none focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:ring-ring cursor-pointer ${
    $$restProps.class || ''
  }`;

  function isPathType(x: string | PathType | (() => void)): x is PathType {
    return Object.values(Paths).includes(x as PathType);
  }

  function handleClickPath(e: Event) {
    e.preventDefault();
    navigate(onClickOrHrefOrPath as PathType);
  }
</script>

{#if isPathType(onClickOrHrefOrPath)}
  <a href={onClickOrHrefOrPath} on:click={handleClickPath} class={sharedClass}>
    <slot />
  </a>
{:else if typeof onClickOrHrefOrPath === 'string'}
  <a href={onClickOrHrefOrPath} class={sharedClass}>
    <slot />
  </a>
{:else}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <a on:click={onClickOrHrefOrPath} class={sharedClass}>
    <slot />
  </a>
{/if}
