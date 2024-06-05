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
          radio: '*', // needed for compiling
          'machine-learning-poc': '*'
        },
        files: [...Object.keys(mainFiles), 'README.md'],
      }),
    },
  };

  const updateDepsForCodeView = (pxt: string): string => {
    const newPxt = JSON.parse(pxt)
    newPxt.dependencies['Machine Learning POC'] = "github:microbit-foundation/pxt-ml-extension-poc#v0.3.2"
    return JSON.stringify(newPxt)
  }

  // The code view component is not using the static MakeCode so it can't reference
  // the bundled ML extension and needs to be fetched from github instead.
  $: makeCodeProjectForCodeView = {
      text: {
        ...makeCodeProject.text,
        'pxt.json': updateDepsForCodeView(makeCodeProject.text['pxt.json'])
      },
    }

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
    state.update(obj => {
      obj.outputHex = hexData;
      return obj;
    });
    startConnectionProcess();
  };
</script>

<h1 class="text-2xl font-bold pb-3 pt-10">{$t('content.output.header')}</h1>
<p class="text-center leading-relaxed w-150">
  {$t('content.output.description')}
</p>
<CodeView code={makeCodeProjectForCodeView} />
<StandardButton onClick={handleEdit} class="my-5" type="primary"
  >{$t('content.output.button.program')}</StandardButton>
<EditCodeDialog
  code={makeCodeProject}
  isOpen={isCodeEditorOpen}
  onClose={handleEditDialogClose}
  onCodeChange={handleCodeChange}
  onDownload={handleDownload}
  baseUrl='https://ml-poc-e2e.pxt-microbit.pages.dev/' />
