<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  export let elevated = false;
  export let mr = false;
  export let ml = false;
  export let small = false;
  export let selected = false;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- Not a button as it would cause nesting of buttons -->
<div
  on:click
  class="{$$restProps.class || ''} rounded-lg bg-backgroundlight border-1 {selected
    ? 'border-brand-500'
    : 'border-transparent'}"
  class:h-30={small}
  class:shadow-md={elevated}
  class:ml-2={ml && small}
  class:mr-2={mr && small}
  class:ml-5={ml && !small}
  class:mr-5={mr && !small}>
  <slot />
</div>
