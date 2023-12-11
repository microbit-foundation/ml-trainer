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

<script lang="ts">
  import TypingUtils from '../script/TypingUtils.js';

  type ButtonSize = 'small' | 'normal' | 'large';
  type ButtonVariant = 'secondary' | 'primary' | 'warning' | 'info' | 'infolight';

  export let type: ButtonVariant = 'secondary';
  export let onClick: (e: Event) => void = TypingUtils.emptyFunction;
  export let disabled = false;
  export let size: ButtonSize = 'normal';
  export let shadows = true;
  export let position: 'center' | 'right' = 'center';
  export let extraClasses: string = '';

  const classes: { [key in ButtonVariant]: string } = {
    primary: 'bg-primary text-white border-solid border-2 border-primary',
    secondary: 'bg-white text-black border-solid border-2 border-primary',
    warning: 'bg-warning text-white',
    info: 'bg-info',
    infolight: 'bg-infolight',
  };

  function getPosition(): string {
    if (position === 'right') {
      return 'content-end place-items-end';
    }
    return 'content-center place-items-center';
  }
</script>

<div class="grid grid-cols-1 {extraClasses} {getPosition()}">
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
