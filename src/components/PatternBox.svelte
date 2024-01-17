<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<style>
  .turnedOn {
    animation: turnOn 0.3s ease;
  }

  .turnedOff {
    animation: turnOff 0.3s ease;
  }

  @keyframes turnOn {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.15);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes turnOff {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(0.8);
    }
    100% {
      transform: scale(1);
    }
  }
</style>

<script lang="ts">
  export let isOn: boolean;
  export let isHighlighted: boolean;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- Intentionally not identifying as buttons for sr  -->
<div
  class="rounded"
  class:border-3={isHighlighted}
  class:turnedOn={isOn}
  class:turnedOff={!isOn}
  class:bg-secondary={isOn}
  class:border-secondary={isHighlighted}
  class:bg-gray-300={!isOn}
  on:mousedown
  on:mouseenter />
