<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from './../i18n';

  export let colIdx: number;
  export let value: number;

  let isFocused = false;
  const id = `columnInput${colIdx}`;

  const onFocusIn = () => {
    isFocused = true;
  };
  const onFocusOut = () => {
    isFocused = false;
  };
</script>

<div>
  <label for={id} class="sr-only">
    {$t('connectMB.pattern.inputLabel', {
      values: {
        colNum: colIdx + 1,
      },
    })}</label>
  <input
    {value}
    on:keydown
    on:focusin={onFocusIn}
    on:focusout={onFocusOut}
    class="w-full mt-2 text-center outline-none focus-visible:ring-4 focus-visible:ring-ring"
    class:cursor-default={isFocused === false}
    style="opacity: {isFocused ? 1 : 0}"
    type="number"
    {id}
    name={id}
    min="1"
    max="5" />
</div>
