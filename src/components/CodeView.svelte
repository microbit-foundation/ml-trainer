<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script>
  import React from 'react';
  import {
    MakeCodeBlocksRendering,
    MakeCodeRenderBlocksProvider,
    useMakeCodeRenderBlocks,
    useMakeCodeRenderBlocksContext,
  } from '@microbit-foundation/react-code-view';
  import { createRoot } from 'react-dom/client';
  import { onDestroy, onMount } from 'svelte';

  let container;
  let root;

  export const projectWithMelody = {
    header: {
      target: 'microbit',
      targetVersion: '3.0.17',
      name: 'Untitled',
      meta: {},
      editor: 'blocksprj',
      pubId: '',
      pubCurrent: false,
      _rev: null,
      id: '8dd48233-0ebb-4426-7b6d-9af3a1a887f0',
      recentUse: 1601371026,
      modificationTime: 1601371026,
      blobId: null,
      blobVersion: null,
      blobCurrent: false,
      isDeleted: false,
      githubCurrent: false,
      saveId: null,
    },
    text: {
      'main.blocks':
        '<xml xmlns="https://developers.google.com/blockly/xml"><block type="pxt-on-start" x="0" y="0"><statement name="HANDLER"><block type="playMelody"><value name="melody"><shadow type="melody_editor"><field name="melody">"C5 B A G F E D C "</field></shadow></value><value name="tempo"><shadow type="math_number_minmax"><mutation min="40" max="500" label="Tempo" precision="0"/><field name="SLIDER">120</field></shadow></value></block></statement></block></xml>',
      'main.ts': 'music.playMelody("C5 B A G F E D C ", 120)\n',
      'README.md': ' ',
      'pxt.json':
        '{\n    "name": "Untitled",\n    "description": "",\n    "dependencies": {\n        "core": "*",\n        "radio": "*"\n    },\n    "files": [\n        "main.blocks",\n        "main.ts",\n        "README.md"\n    ],\n    "preferredEditor": "blocksprj"\n}\n',
      '.simstate.json': '{}',
    },
  };

  const blocks = React.createElement(MakeCodeBlocksRendering, {
    code: '',
  });
  const element = React.createElement(
    MakeCodeRenderBlocksProvider,
    { version: 'default' },
    blocks,
  );

  onMount(() => {
    root = createRoot(container);
    try {
      root.render(element);
    } catch (err) {
      console.warn(`react-adapter failed to mount.`, { err });
    }
  });

  onDestroy(() => {
    try {
      container && root && root.unmount();
    } catch (err) {
      console.warn(`react-adapter failed to unmount.`, { err });
    }
  });
</script>

<div bind:this={container} class={$$props.class} />
