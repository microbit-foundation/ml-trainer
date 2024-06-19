<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import {
    BlockLayout,
    MakeCodeProject,
    createMakeCodeRenderBlocks,
  } from '@microbit-foundation/react-code-view';
  import { onDestroy, onMount } from 'svelte';

  export let options = {};
  export let code: MakeCodeProject;
  export let scale: number = 1;

  const makeCodeRef = createMakeCodeRenderBlocks(options);
  let firstInitDone = false;

  const render = async () => {
    if (!firstInitDone) {
      // First time initialisation
      makeCodeRef.initialize();
      firstInitDone = true;
    }
    console.log('code view render blocks');
    return makeCodeRef.renderBlocks({
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
    makeCodeRef.dispose();
  });
</script>

{#await renderBlocksPromise}
  <p>Loading ...</p>
{:then renderBlocksResp}
  <img
    alt={code === undefined || typeof code === 'string' ? code : code.text['main.ts']}
    src={renderBlocksResp.uri}
    width={renderBlocksResp.width ? scale * renderBlocksResp.width : undefined}
    height={renderBlocksResp.height} />
{:catch error}
  <p>System error: {error}.</p>
{/await}
