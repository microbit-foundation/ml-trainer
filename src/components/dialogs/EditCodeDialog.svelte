<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { MakeCodeEditor } from '@microbit-foundation/react-editor-embed';
  import ReactAdapter from '../utils/ReactAdapter.svelte';
  import FullScreenDialog from './FullScreenDialog.svelte';
  import { MakeCodeProject } from '@microbit-foundation/react-code-view';

  export let baseUrl: string;
  export let code: object;
  export let isOpen: boolean;
  export let onClose: () => void;
  export let onCodeChange: (newCode: MakeCodeProject) => void;
  export let onDownload: (download: { name: string; hex: string }) => void;
  export let onSave: undefined | ((save: { name: string; hex: string }) => void);

  const handleSave = (save: { name: string; hex: string }) => {
    const blob = new Blob([save.hex], {type: "application/octet-stream"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${save.name}.hex`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
</script>

<FullScreenDialog {isOpen} {onClose} class="w-full h-full space-y-5">
  <svelte:fragment slot="body">
    <div class="flex flex-col items-center pb-5 bg-backgrounddark h-full">
      <ReactAdapter
        el={MakeCodeEditor}
        style={{ height: '100%' }}
        initialCode={code}
        controller={2}
        onBack={onClose}
        class="w-full h-full"
        onSave={handleSave}
        {baseUrl}
        {onCodeChange}
        {onDownload} />
    </div>
  </svelte:fragment>
</FullScreenDialog>
