<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import {
    BlockLayout,
    createMakeCodeRenderBlocks,
  } from '@microbit-foundation/react-code-view';
  import { onDestroy, onMount } from 'svelte';
  import { t } from '../i18n';
  import StandardButton from './StandardButton.svelte';
  export let options = {};
  export let code: object;
  export let onEdit: () => void;

  const { initialize, renderBlocks, dispose } = createMakeCodeRenderBlocks(options);
  let hasInitialized = false;

  const render = async () => {
    if (!hasInitialized) {
      // First time initialisation
      await initialize();
      hasInitialized = true;
    }
    return renderBlocks({
      code: code,
      options: { layout: BlockLayout.Flow },
    });
  };

  // code is added to ensure it re-renders when code has been updated
  $: renderBlocksPromise = code && render();
  onMount(() => {
    render();
  });

  onDestroy(() => {
    dispose();
  });
</script>

<div class="mx-20 my-5">
  {#await renderBlocksPromise}
    <p>Loading ...</p>
  {:then renderBlocksResp}
    <div class="w-full bg-white p-5 rounded-lg">
      <img
        alt={code === undefined || typeof code === 'string' ? code : code.text['main.ts']}
        src={renderBlocksResp.uri}
        width={renderBlocksResp.width}
        height={renderBlocksResp.height} />
    </div>
    <StandardButton onClick={onEdit} class="my-5"
      >{$t('content.output.codeEditor.button.edit')}</StandardButton>
  {:catch error}
    <p>System error: {error.message}.</p>
  {/await}
</div>
