<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script>
  import {
      createMakeCodeRenderBlocks
  } from '@microbit-foundation/react-code-view';
  import { onMount } from 'svelte';
  export let options = {}
  export let code

  const {initialize, renderBlocks, dispose} = createMakeCodeRenderBlocks(options)
  const render = async() => {
      await initialize()
      return renderBlocks({
        code: code
      });
    }
  
  let renderBlocksPromise = render()
  onMount(() => {
    render()
  }, () => {
    dispose()
  });
</script>

<p>
	{#await renderBlocksPromise}
		Loading ...
	{:then renderBlocksResp}
      <img
      className="ui image"
      alt={
        code === undefined || typeof code === 'string'
          ? code
          : code.text['main.ts']
      }
      src={renderBlocksResp.uri}
      width={renderBlocksResp.width}
      height={renderBlocksResp.height}
    />
	{:catch error}
		System error: {error.message}.
	{/await}
</p>


