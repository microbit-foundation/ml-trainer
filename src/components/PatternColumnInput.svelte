<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from './../i18n';

  export let colIdx: number;
  export let value: number;

  let isFocused = false;
</script>

<div>
  <label for="columnInput" class="sr-only">
    {$t('connectMB.pattern.inputLabel', {
      values: {
        colNum: colIdx + 1,
      },
    })}</label>
  <input
    on:change
    {value}
    on:focusin={() => {
      isFocused = true;
    }}
    on:focusout={() => {
      isFocused = false;
    }}
    class="w-full text-center {isFocused ? 'w-full' : 'w-0'}"
    type="number"
    id="columnInput"
    name="columnInput"
    min="1"
    max="5" />
</div>
