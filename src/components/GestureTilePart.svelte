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
  export let onClick: () => void = () => {};
</script>

<div
  on:click={onClick}
  class="{$$restProps.class || ''} rounded-lg bg-backgroundlight {selected &&
    'border-brand-500 border-1'}"
  class:h-30={small}
  class:shadow-md={elevated}
  class:ml-2={ml && small}
  class:mr-2={mr && small}
  class:ml-5={ml && !small}
  class:mr-5={mr && !small}>
  <slot />
</div>
