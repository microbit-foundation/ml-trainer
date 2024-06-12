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
    generateMakeCodeMainBlocksXml,
    generateMakeCodeMainTs,
  } from '../../script/makecode/generateMainTsAndBlocks';
  import { gestures } from '../../script/stores/Stores';
  import { get } from 'svelte/store';
  import {
    ConnectDialogStates,
    connectionDialogState,
  } from '../../script/stores/connectDialogStore';
  import { makeCodeProject, state } from '../../script/stores/uiStore';
  import { DeviceRequestStates } from '../../script/microbit-interfacing/MicrobitConnection';
  import {
    generateCustomTs,
    generateCustomJson,
  } from '../../script/makecode/generateCustomTsAndJson';
  import { filenames, iconNames, isEmpty, pxt } from '../../script/makecode/utils';
  import { model as modelStore } from '../../script/stores/mlStore';
  import Gesture from '../../script/domain/Gesture';
  import { LayersModel } from '@tensorflow/tfjs';

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
      [filenames.mainBlocks]: generateMakeCodeMainBlocksXml(actionConfigs),
      [filenames.mainTs]: generateMakeCodeMainTs(actionConfigs),
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
<CodeView code={project} />
<div class="flex flex-row my-5 gap-5">
  <StandardButton onClick={handleEdit} type="primary"
    >{$t('content.output.button.program')}</StandardButton>
  <StandardButton onClick={handleResetToDefault} type="secondary"
    >{$t('content.output.button.resetToDefault')}</StandardButton>
</div>
<EditCodeDialog
  code={project}
  isOpen={isCodeEditorOpen}
  onClose={handleEditDialogClose}
  onCodeChange={handleCodeChange}
  onDownload={handleDownload}
  baseUrl="https://pxt-microbit.pages.dev/" />
