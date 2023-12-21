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

  :disabled {
    background-color: transparent;
    border-color: #ccc;
    color: #ccc;
    box-shadow: none;
  }
</style>

<script lang="ts" context="module">
  export type ButtonVariant = 'secondary' | 'primary' | 'warning' | 'info' | 'infolight';
</script>

<script lang="ts">
  import TypingUtils from '../script/TypingUtils';

  type ButtonSize = 'small' | 'normal' | 'large';

  export let type: ButtonVariant = 'secondary';
  export let onClick: (e: Event) => void = TypingUtils.emptyFunction;
  export let disabled = false;
  export let size: ButtonSize = 'normal';
  export let shadows = true;

  const classes: { [key in ButtonVariant]: string } = {
    primary: 'bg-primary text-white border-solid border-2 border-primary',
    secondary: 'bg-white text-black border-solid border-2 border-primary',
    warning: 'bg-warning text-white',
    info: 'bg-info',
    infolight: 'bg-infolight',
  };
</script>

<div class="grid grid-cols-1 place-items-center">
  <button
    {disabled}
    class="{classes[type]} font-bold outline-none rounded-full {size}"
    class:shadow-md={shadows}
    class:cursor-pointer={!disabled}
    class:cursor-default={disabled}
    on:click={onClick}>
    <slot />
  </button>
</div>
