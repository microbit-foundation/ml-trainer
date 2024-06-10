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
    getModelHexString,
  } from '../../script/makecode/generateCustomTs';
  import { filenames, iconNames, isEmpty, pxt } from '../../script/makecode/utils';
  import { model as modelStore } from '../../script/stores/mlStore';

  const updateCustomTs = (
    project: MakeCodeProject,
    gestureNames: string[],
    modelHexStr: string,
  ) => {
    return {
      ...project.text,
      // Keep custom ts updated as gesture and model is updated by user
      [filenames.customTs]: generateCustomTs(gestureNames, modelHexStr),
    };
  };

  const generateDefaultProjectText = (gestureNames: string[], modelHexStr: string) => {
    const actionConfigs = gestureNames.map((name, idx) => ({
      name,
      iconName: iconNames[idx % iconNames.length],
    }));
    return {
      [filenames.mainBlocks]: generateMakeCodeMainBlocksXml(actionConfigs),
      [filenames.mainTs]: generateMakeCodeMainTs(actionConfigs),
      [filenames.customTs]: generateCustomTs(gestureNames, modelHexStr),
      'README.md': ' ',
      'pxt.json': JSON.stringify(pxt),
    };
  };

  const gs = gestures.getGestures();
  const gestureNames = gs.map(g => g.getName());
  const model = get(modelStore);
  const savedProject = get(makeCodeProject);
  const modelHexStr = getModelHexString(gestureNames, model);

  let project: MakeCodeProject = {
    text: isEmpty(savedProject)
      ? generateDefaultProjectText(gestureNames, modelHexStr)
      : updateCustomTs(savedProject as MakeCodeProject, gestureNames, modelHexStr),
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
<StandardButton onClick={handleEdit} class="my-5" type="primary"
  >{$t('content.output.button.program')}</StandardButton>
<EditCodeDialog
  code={project}
  isOpen={isCodeEditorOpen}
  onClose={handleEditDialogClose}
  onCodeChange={handleCodeChange}
  onDownload={handleDownload}
  baseUrl="https://pxt-microbit.pages.dev/" />
