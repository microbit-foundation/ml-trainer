<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<style>
  .buttonGrid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr 1fr 1fr;
    gap: 2px 2px;
    grid-template-areas:
      '. . . . .'
      '. . . . .'
      '. . . . .'
      '. . . . .'
      '. . . . .';
  }
</style>

<script lang="ts">
  export let matrix: boolean[] | undefined = undefined;
  export let ariaLabel: string | undefined = undefined;
  export let brandColor: boolean = true;
  export let dimension: number = 18;
</script>

<div
  class="buttonGrid h-{dimension} w-{dimension} select-none ml-0"
  role="img"
  aria-label={ariaLabel}>
  <!-- Draw all 25 boxes -->
  {#each matrix ?? new Array(25).fill(false) as button}
    <div
      class="{button
        ? brandColor
          ? 'bg-brand-400'
          : 'bg-[#FF0000]'
        : 'bg-gray-300'} rounded-[2px]"
      class:turnedOn={button}
      class:turnedOff={!button} />
  {/each}
</div>
