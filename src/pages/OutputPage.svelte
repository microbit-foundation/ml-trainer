<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { MakeCodeEditor } from '@microbit-foundation/react-editor-embed';
  import CodeView from '../components/CodeView.svelte';
  import ReactAdapter from '../components/utils/ReactAdapter.svelte';
  import { t } from '../i18n';
  import { Paths, getTitle } from '../router/paths';
  import TabView from '../views/TabView.svelte';
  import { generateMakeCodeMain } from '../script/generateMakeCodeMain';
  import { gestures } from '../script/stores/Stores';

  $: title = getTitle(Paths.OUTPUT, $t);

  const gs = gestures.getGestures()
  const maints = generateMakeCodeMain(gs.map(g => g.getName()))
  
  export const makeCodeProjectWithExtension = {
  text: {
    'main.ts': maints,
    'README.md': ' ',
    "pxt.json": `{
      "name": "Untitled",
      "description": "",
      "dependencies": {
          "core": "*",
          "microphone": "*",
          "mkcd-ml-machine": "github:r59q/mkcd-ml-machine#8c2614dc997c8c2634d5e51ce758d25acd9e986e"
      },
      "files": [
          "main.blocks",
          "main.ts",
          "README.md"
      ],
      "preferredEditor": "blocksprj"
    }`
  }}
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<div class="flex flex-col items-center pb-5 bg-backgrounddark h-full">
  <TabView />
  <main class="flex flex-col w-full h-full text-center items-center">
    <h1 class="text-2xl font-bold pb-3 pt-10">{$t('content.output.header')}</h1>
    <p class="text-center leading-relaxed w-150">
      {$t('content.output.description')}
    </p>
    <CodeView code={makeCodeProjectWithExtension} />
    <div
      class="flex flex-col flex-1 justify-center items-center text-center max-w-300 w-full h-full">
      <!-- <ReactAdapter
        el={MakeCodeEditor}
        style={{ height: '100%' }}
        initialCode={makeCodeProjectWithExtension}
        parentframedownload
        class="w-full h-full" /> -->
    </div>
  </main>
</div>
