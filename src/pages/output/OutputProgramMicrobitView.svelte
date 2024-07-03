<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { MakeCodeProject } from '@microbit-foundation/react-code-view';
  import { LayersModel } from '@tensorflow/tfjs';
  import lzma from 'lzma/src/lzma_worker';
  import { get } from 'svelte/store';
  import CodeView from '../../components/CodeView.svelte';
  import StandardButton from '../../components/StandardButton.svelte';
  import EditCodeDialog from '../../components/dialogs/EditCodeDialog.svelte';
  import { t } from '../../i18n';
  import Gesture from '../../script/domain/Gesture';
  import {
    generateCustomJson,
    generateCustomTs,
  } from '../../script/makecode/generateCustomTsAndJson';
  import { generateMakeCodeOutputMainDep } from '../../script/makecode/generateMain';
  import { filenames, iconNames, isEmpty, pxt } from '../../script/makecode/utils';
  import { DeviceRequestStates } from '../../script/microbit-interfacing/MicrobitConnection';
  import { gestures } from '../../script/stores/Stores';
  import {
    ConnectDialogStates,
    connectionDialogState,
  } from '../../script/stores/connectDialogStore';
  import { model as modelStore } from '../../script/stores/mlStore';
  import { makeCodeProject, state } from '../../script/stores/uiStore';
  import Microbits from '../../script/microbit-interfacing/Microbits';

  const updateCustomTs = (
    project: MakeCodeProject,
    gs: Gesture[],
    model: LayersModel,
  ) => {
    return {
      ...project.text,
      // Keep custom ts updated as gesture and model is updated by user
      [filenames.customTs]: generateCustomTs(gs, model),
      [filenames.customJson]: generateCustomJson(gs),
    };
  };

  const generateDefaultProjectText = (gs: Gesture[], model: LayersModel) => {
    const gestureNames = gs.map(g => g.getName());
    const actionConfigs = gestureNames.map((name, idx) => ({
      name,
      iconName: iconNames[idx % iconNames.length],
    }));
    return {
      [filenames.mainBlocks]: generateMakeCodeOutputMainDep(actionConfigs, 'blocks'),
      [filenames.mainTs]: generateMakeCodeOutputMainDep(actionConfigs, 'javascript'),
      [filenames.customTs]: generateCustomTs(gs, model),
      [filenames.customJson]: generateCustomJson(gs),
      'README.md': ' ',
      'pxt.json': JSON.stringify(pxt),
    };
  };

  const gs = gestures.getGestures();
  const model = get(modelStore);
  const savedProject = get(makeCodeProject);

  let project: MakeCodeProject = {
    text: isEmpty(savedProject)
      ? generateDefaultProjectText(gs, model)
      : updateCustomTs(savedProject as MakeCodeProject, gs, model),
  };

  let isCodeEditorOpen = false;
  const handleEdit = () => {
    isCodeEditorOpen = true;
  };
  const handleEditDialogClose = () => {
    isCodeEditorOpen = false;
  };
  const handleCodeChange = (code: MakeCodeProject) => {
    project = code;
    $makeCodeProject = code;
  };
  const handleResetToDefault = () => {
    $makeCodeProject = {};
    project = {
      text: generateDefaultProjectText(gs, model),
    };
  };

  const handleDownload = (hexData: string) => {
    // TODO: Only disconnect input micro:bit if user chooses this device.
    Microbits.disconnect(DeviceRequestStates.INPUT);
    Microbits.dispose(DeviceRequestStates.INPUT);
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

  // LZMA isn't a proper module.
  // When bundled it assigns to window. At dev time it works via the above import.
  const LZMA = (window as any).LZMA ?? lzma.LZMA;

  const handleExport = () => {
    const pxtMicrobitVersion = 'v6.0.28';
    const compressed = LZMA.compress(
      JSON.stringify({
        meta: {
          // pxt and pxt/microbit versions are specified and may need updating
          cloudId: 'pxt/microbit',
          targetVersions: {
            branch: pxtMicrobitVersion,
            tag: pxtMicrobitVersion,
            commits:
              'https://github.com/microsoft/pxt-microbit/commit/9d308fa3c282191768670a6558e4df8af2d715cf',
            target: pxtMicrobitVersion,
            pxt: '9.0.19',
          },
          editor: 'blocksprj',
          name: 'some name',
        },
        source: project.text,
      }),
      1,
    );
    const element = document.createElement('a');
    const file = new Blob([new Uint8Array(compressed)], { type: 'application/x-lmza' });
    element.href = URL.createObjectURL(file);
    element.setAttribute('download', 'project.mkcd');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
</script>

<h1 class="text-2xl font-bold pb-3 pt-10">{$t('content.output.header')}</h1>
<p class="text-center leading-relaxed w-150">
  {$t('content.output.description')}
</p>
<div class="mx-20 my-5">
  <div class="w-full bg-white p-5 rounded-lg">
    <CodeView code={project} />
  </div>
</div>
<div class="flex flex-row my-5 gap-5">
  <StandardButton onClick={handleEdit} type="primary">Edit in MakeCode</StandardButton>
  <StandardButton onClick={handleResetToDefault} type="secondary"
    >Reset to default</StandardButton>
  <StandardButton onClick={handleExport} type="secondary"
    >Export for MakeCode</StandardButton>
</div>
<EditCodeDialog
  code={project}
  isOpen={isCodeEditorOpen}
  onClose={handleEditDialogClose}
  onCodeChange={handleCodeChange}
  onDownload={handleDownload}
  baseUrl="https://pxt-microbit.pages.dev/" />
