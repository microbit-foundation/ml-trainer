<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { MakeCodeProject } from '@microbit-foundation/react-code-view';
  import CodeArea from '../components/CodeView.svelte';
  import StandardButton from '../components/StandardButton.svelte';
  import EditCodeDialog from '../components/dialogs/EditCodeDialog.svelte';
  import { t } from '../i18n';
  import { Paths, getTitle } from '../router/paths';
  import { generateMakeCodeMain } from '../script/generateMakeCodeMain';
  import { gestures } from '../script/stores/Stores';
  import { startConnectionProcess } from '../script/stores/connectDialogStore';
  import { state } from '../script/stores/uiStore';
  import TabView from '../views/TabView.svelte';

  $: title = getTitle(Paths.OUTPUT, $t);
  const gs = gestures.getGestures();

  const mainFiles = generateMakeCodeMain(gs.map(g => g.getName()));
  let makeCodeProject: MakeCodeProject = {
    text: {
      ...mainFiles,
      'README.md': ' ',
      'pxt.json': JSON.stringify({
        name: 'Untitled',
        description: '',
        dependencies: {
          core: '*',
          microphone: '*',
          'Machine Learning POC':
            'github:microbit-foundation/pxt-ml-extension-poc#v0.1.23',
        },
        files: [...Object.keys(mainFiles), 'README.md'],
      }),
    },
  };

  let isCodeEditorOpen = false;
  const handleEdit = () => {
    isCodeEditorOpen = true;
  };
  const handleEditDialogClose = () => {
    isCodeEditorOpen = false;
  };
  const handleCodeChange = (code: MakeCodeProject) => {
    makeCodeProject = code;
  };

  const handleDownload = (hexData: string) => {
    // TODO: To remove, for development purposes
    // Faking though input is connected
    state.update(obj => {
      obj.outputHex = hexData;
      obj.isInputConnected = true;
      return obj;
    });
    startConnectionProcess();
  };
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
    <CodeArea code={makeCodeProject} />
    <StandardButton onClick={handleEdit} class="my-5" type="primary"
      >{$t('content.output.button.program')}</StandardButton>
    <EditCodeDialog
      code={makeCodeProject}
      isOpen={isCodeEditorOpen}
      onClose={handleEditDialogClose}
      onCodeChange={handleCodeChange}
      onDownload={handleDownload} />
  </main>
</div>
