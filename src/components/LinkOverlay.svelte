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
  import { PathType, navigate } from '../router/paths';

  export let href: string | undefined = undefined;
  export let path: PathType | undefined = undefined;
  export let disabled: boolean = false;

  function handleClick(e: Event) {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (path) {
      e.preventDefault();
      navigate(path);
    }
  }
</script>

<a
  href={href ?? path}
  role="link"
  aria-disabled={disabled}
  on:click={handleClick}
  class="overlay outline-none focus-visible:ring-4 focus-visible:ring-offset-1
  focus-visible:ring-ring {$$restProps.class || ''}">
  <slot />
</a>
