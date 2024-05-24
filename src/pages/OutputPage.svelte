<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import CodeArea from '../components/CodeArea.svelte';
  import EditCodeDialog from '../components/dialogs/EditCodeDialog.svelte';
  import { t } from '../i18n';
  import { Paths, getTitle } from '../router/paths';
  import { generateMakeCodeMain } from '../script/generateMakeCodeMain';
  import { gestures } from '../script/stores/Stores';
  import TabView from '../views/TabView.svelte';

  $: title = getTitle(Paths.OUTPUT, $t);
  const gs = gestures.getGestures();

  const main = generateMakeCodeMain(gs.map(g => g.getName()));
  let makeCodeProject: object = {
    text: {
      'main.ts': main['main.ts'],
      'main.blocks': main['main.blocks'],
      'README.md': ' ',
      'pxt.json': JSON.stringify({
        name: 'Untitled',
        description: '',
        dependencies: {
          core: '*',
          microphone: '*',
          'mkcd-ml-machine':
            'github:r59q/mkcd-ml-machine#8c2614dc997c8c2634d5e51ce758d25acd9e986e',
        },
        files: ['main.blocks', 'main.ts', 'README.md'],
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
  const handleCodeChange = (code: object) => {
    makeCodeProject = code
  }

  const handleDownload = (hexData: string) => {
    console.log("hexData", hexData)
  }
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
    <CodeArea code={makeCodeProject} onEdit={handleEdit} />
    <EditCodeDialog
      code={makeCodeProject}
      isOpen={isCodeEditorOpen}
      onClose={handleEditDialogClose}
      onCodeChange={handleCodeChange} 
      onDownload={handleDownload}/>
  </main>
</div>
