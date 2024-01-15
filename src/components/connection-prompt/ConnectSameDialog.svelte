<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT

  COMPONENT NOT IN USE
 -->

<script lang="ts">
  import StandardButton from '../StandardButton.svelte';
  import { t } from '../../i18n';

  export let onConnectSameClick: () => void;
  export let onConnectDifferentClick: () => void;
</script>

<main>
  <div class="text-center mb-5 font-bold text-lg">
    <h1>
      {$t('connectMB.output.header')}
    </h1>
  </div>
  <div class="grid grid-cols-2 w-600px text-center">
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="hover:cursor-pointer mr-2 border-gray-200 border border-solid rounded-lg p-6 shadow-lg"
      on:click={onConnectSameClick}>
      <h1 class="font-bold mb-6">
        {$t('connectMB.outputMB.same')}
      </h1>

      <StandardButton>{$t('connectMB.outputMB.sameButton')}</StandardButton>
    </div>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="hover:cursor-pointer ml-2 border-gray-200 border border-solid rounded-lg p-6 shadow-lg"
      on:click={onConnectDifferentClick}>
      <h1 class="font-bold mb-6">
        {$t('connectMB.outputMB.different')}
      </h1>

      <StandardButton>{$t('connectMB.outputMB.otherButton')}</StandardButton>
    </div>
  </div>
</main>
