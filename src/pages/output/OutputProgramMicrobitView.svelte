<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { MakeCodeProject } from '@microbit-foundation/react-code-view';
  import CodeView from '../../components/CodeView.svelte';
  import StandardButton from '../../components/StandardButton.svelte';
  import EditCodeDialog from '../../components/dialogs/EditCodeDialog.svelte';
  import { t } from '../../i18n';
  import { generateMakeCodeMain } from '../../script/generateMakeCodeMain';
  import { gestures } from '../../script/stores/Stores';
  import {
    ConnectDialogStates,
    connectionDialogState,
  } from '../../script/stores/connectDialogStore';
  import { state } from '../../script/stores/uiStore';
  import { DeviceRequestStates } from '../../script/microbit-interfacing/MicrobitConnection';

  const gs = gestures.getGestures();

  const mainFiles = generateMakeCodeMain(gs.map(g => g.getName()));
  let makeCodeProject: MakeCodeProject = $state.makeCodeProject ?? {
    text: {
      ...mainFiles,
      'README.md': ' ',
      'pxt.json': JSON.stringify({
        name: 'Untitled',
        description: '',
        dependencies: {
          core: '*',
          microphone: '*',
          radio: '*', // needed for compiling
          'Machine Learning POC':
            'github:microbit-foundation/pxt-ml-extension-poc#v0.3.5',
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
    state.update(obj => {
      obj.makeCodeProject = code;
      return obj;
    });
  };

  const handleDownload = (hexData: string) => {
    state.update(obj => {
      obj.outputHex = hexData;
      return obj;
    });
    connectionDialogState.update(s => {
      s.connectionState = ConnectDialogStates.CONNECT_CABLE;
      s.deviceState = DeviceRequestStates.OUTPUT;
      return s;
    });
  };
</script>

<h1 class="text-2xl font-bold pb-3 pt-10">{$t('content.output.header')}</h1>
<p class="text-center leading-relaxed w-150">
  {$t('content.output.description')}
</p>
<CodeView code={makeCodeProject} />
<StandardButton onClick={handleEdit} class="my-5" type="primary"
  >{$t('content.output.button.program')}</StandardButton>
<EditCodeDialog
  code={makeCodeProject}
  isOpen={isCodeEditorOpen}
  onClose={handleEditDialogClose}
  onCodeChange={handleCodeChange}
  onDownload={handleDownload}
  baseUrl="https://pxt-microbit.pages.dev/" />
