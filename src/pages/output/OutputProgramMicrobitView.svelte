<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { MakeCodeProject } from '@microbit-foundation/react-code-view';
  import CodeArea from '../../components/CodeView.svelte';
  import StandardButton from '../../components/StandardButton.svelte';
  import EditCodeDialog from '../../components/dialogs/EditCodeDialog.svelte';
  import { t } from '../../i18n';
  import {
    generateMakeCodeMain,
    generateRandomLedPattern,
  } from '../../script/generateMakeCodeMain';
  import { gestures } from '../../script/stores/Stores';
  import { startConnectionProcess } from '../../script/stores/connectDialogStore';
  import { state } from '../../script/stores/uiStore';

  const gs = gestures.getGestures();

  const gestureOutputConfigs = gs.map(g => ({
    name: g.getName(),
    ledPattern: generateRandomLedPattern(),
  }));

  const mainFiles = generateMakeCodeMain(gestureOutputConfigs);
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
          'machine-learning-poc': '*'
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
