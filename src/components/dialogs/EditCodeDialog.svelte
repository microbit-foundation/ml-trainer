<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { MakeCodeEditor } from '@microbit-foundation/react-editor-embed';
  import ReactAdapter from '../utils/ReactAdapter.svelte';
  import FullScreenDialog from './FullScreenDialog.svelte';
  import { MakeCodeProject } from '@microbit-foundation/react-code-view';

  export let code: object;
  export let isOpen: boolean;
  export let onClose: () => void;
  export let onCodeChange: (newCode: MakeCodeProject) => void;
  export let onDownload: (hexData: string) => void;

</script>

<FullScreenDialog {isOpen} {onClose} class="w-full h-full space-y-5">
  <svelte:fragment slot="body">
    <div class="flex flex-col items-center pb-5 bg-backgrounddark h-full">
      <ReactAdapter
        el={MakeCodeEditor}
        style={{ height: '100%' }}
        initialCode={code}
        queryParams={{ "parentframedownload": "1" }}
        class="w-full h-full"
        baseUrl='https://add-extension.pxt-microbit.pages.dev/'
        {onCodeChange}
        {onDownload} />
    </div>
  </svelte:fragment>
</FullScreenDialog>
