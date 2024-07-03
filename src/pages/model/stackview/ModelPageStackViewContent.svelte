<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->
<script lang="ts">
  import { MakeCodeProject } from '@microbit-foundation/react-editor-embed';
  import { LayersModel } from '@tensorflow/tfjs';
  import lzma from 'lzma/src/lzma_worker';
  import { get } from 'svelte/store';
  import { fade } from 'svelte/transition';
  import StandardButton from '../../../components/StandardButton.svelte';
  import BottomPanel from '../../../components/bottom/BottomPanel.svelte';
  import Information from '../../../components/information/Information.svelte';
  import OutputGesture from '../../../components/output/OutputGesture.svelte';
  import downArrowImage from '../../../imgs/down_arrow.svg';
  import Gesture from '../../../script/domain/Gesture';
  import {
    generateCustomJson,
    generateCustomTs,
  } from '../../../script/makecode/generateCustomTsAndJson';
  import { generateMakeCodeOutputMain } from '../../../script/makecode/generateMain';
  import { filenames, isEmpty, pxt } from '../../../script/makecode/utils';
  import { gestures } from '../../../script/stores/Stores';
  import { model as modelStore } from '../../../script/stores/mlStore';
  import { makeCodeProject, state } from '../../../script/stores/uiStore';
  import { t } from './../../../i18n';
  import EditCodeDialog from '../../../components/dialogs/EditCodeDialog.svelte';
  import {
    ConnectDialogStates,
    connectionDialogState,
  } from '../../../script/stores/connectDialogStore';
  import { DeviceRequestStates } from '../../../script/microbit-interfacing/MicrobitConnection';
  import CodeView from '../../../components/CodeView.svelte';
  import GestureTilePart from '../../../components/GestureTilePart.svelte';
  import Microbits from '../../../script/microbit-interfacing/Microbits';

  // Bool flags to know whether output microbit popup should be show
  let hasClosedPopup = false;

  let hasInteracted = false;

  // Bool flag to know whether to show the titles for the output gestures
  const enableOutputGestures = false;

  function onUserInteraction(): void {
    hasInteracted = true;
  }

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
    return {
      [filenames.mainBlocks]: generateMakeCodeOutputMain(gs, 'blocks'),
      [filenames.mainTs]: generateMakeCodeOutputMain(gs, 'javascript'),
      [filenames.customTs]: generateCustomTs(gs, model),
      [filenames.customJson]: generateCustomJson(gs),
      'README.md': ' ',
      'pxt.json': JSON.stringify(pxt),
    };
  };

  const gs = gestures.getGestures();
  const model = get(modelStore);
  const savedProject = get(makeCodeProject);

  $: project = {
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

  let showDefaultView = isEmpty(savedProject);
  const handleCodeChange = (code: MakeCodeProject) => {
    project = code;
    $makeCodeProject = code;
    showDefaultView = false;
  };
  const handleResetToDefault = () => {
    $makeCodeProject = {};
    project = {
      text: generateDefaultProjectText(gs, model),
    };
    showDefaultView = true;
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
</script>

<EditCodeDialog
  code={project}
  isOpen={isCodeEditorOpen}
  onClose={handleEditDialogClose}
  onCodeChange={handleCodeChange}
  onDownload={handleDownload}
  baseUrl="https://pxt-microbit.pages.dev/" />

<h1 class="sr-only">{$t('content.index.toolProcessCards.model.title')}</h1>
<div class="flex flex-col h-full bg-backgrounddark">
  <div class="flex flex-col flex-grow">
    <div
      class="grid {enableOutputGestures
        ? 'grid-cols-[292px,360px,177px,146px,1fr]'
        : 'grid-cols-[292px,360px,30px,auto]'} gap-x-7 items-center h-13 px-10 z-3 border-b-3 border-gray-200 sticky top-0 bg-backgrounddark">
      <Information
        underlineIconText={false}
        isLightTheme={false}
        iconText={$t('content.model.output.action.iconTitle')}
        titleText={$t('content.model.output.action.descriptionTitle')}
        bodyText={$t('content.model.output.action.descriptionBody')} />
      <Information
        underlineIconText={false}
        isLightTheme={false}
        iconText={$t('content.model.output.certainty.iconTitle')}
        titleText={$t('content.model.output.certainty.descriptionTitle')}
        bodyText={$t('content.model.output.certainty.descriptionBody')} />
      <!-- Empty div to fill up arrow column -->
      <div></div>
      <div class="flex flex-row items-center justify-between">
        <Information
          underlineIconText={false}
          isLightTheme={false}
          iconText="Output"
          titleText="Output"
          bodyText="What the micro:bit will do when each action is detected." />
        <div class="flex flex-row gap-x-2">
          {#if !showDefaultView}
            <StandardButton size="small" onClick={handleResetToDefault} type="secondary"
              >Reset to default</StandardButton>
          {/if}
          <StandardButton size="small" onClick={handleEdit} type="secondary"
            >Edit in MakeCode</StandardButton>
          <StandardButton size="small" onClick={handleExport} type="secondary"
            >Export</StandardButton>
        </div>
      </div>
      {#if enableOutputGestures}
        <Information
          isLightTheme={false}
          iconText={$t('content.model.output.ledOutput.descriptionTitle')}
          titleText={$t('content.model.output.ledOutput.descriptionTitle')}
          bodyText={$t('content.model.output.ledOutput.descriptionBody')} />
        <Information
          isLightTheme={false}
          iconText={$t('content.model.output.sound.iconTitle')}
          titleText={$t('content.model.output.sound.descriptionTitle')}
          bodyText={$t('content.model.output.sound.descriptionBody')} />
        <Information
          isLightTheme={false}
          iconText={$t('content.model.output.pin.iconTitle')}
          titleText={$t('content.model.output.pin.descriptionTitle')}
          bodyText={$t('content.model.output.pin.descriptionBody')} />
      {/if}
    </div>
    <div
      class="flex flex-col w-full h-full py-2 px-10 flex-grow flex-shrink h-0 overflow-y-auto">
      <div class="flex flex-row">
        <div
          class="grid {enableOutputGestures
            ? 'grid-cols-[292px,360px,177px,146px,max-content]'
            : `grid-cols-[292px,360px,30px${
                showDefaultView ? ',auto]' : ',auto]'
              }`} gap-x-7 gap-y-3 pb-2"
          style="height: fit-content">
          <!-- Display all gestures and their output capabilities -->
          {#each gestures.getGestures() as gesture}
            <section class="contents">
              <OutputGesture
                variant="stack"
                {gesture}
                {onUserInteraction}
                {project}
                showOutput={showDefaultView} />
            </section>
          {/each}
        </div>
        {#if !showDefaultView}
          <div class="pb-2 flex-grow">
            <GestureTilePart
              elevated={true}
              class="flex-grow flex flex-col h-full justify-center py-2 px-5 ">
              <CodeView code={project} />
            </GestureTilePart>
          </div>
        {/if}
      </div>
    </div>
    {#if !$state.isOutputConnected && !hasClosedPopup && hasInteracted}
      <div transition:fade class="grid grid-cols-5 absolute bottom-5 w-full min-w-729px">
        <div
          class="flex relative col-start-2 rounded-lg col-end-5 h-35"
          style="background-color:rgba(231, 229, 228, 0.85)">
          <div class="m-4 mr-2 w-3/4">
            <p class="text-2xl font-bold">
              {$t('content.model.output.popup.header')}
            </p>
            <p>
              {$t('content.model.output.popup.body')}
            </p>
          </div>
          <div class="text-center ml-0 mb-2 mt-8">
            <img
              class="m-auto arrow-filter-color"
              src={downArrowImage}
              alt={$t('arrowIconDown.altText')}
              width={80} />
          </div>
          <div class="absolute right-2 top-2">
            <button
              class="hover:bg-gray-100 rounded outline-transparent w-8"
              on:click={() => {
                hasClosedPopup = true;
              }}>
              <i
                class="fas fa-plus text-lg text-gray-600 hover:text-gray-800 duration-75"
                style="transform: rotate(45deg);" />
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
  <div class="h-160px w-full">
    <BottomPanel />
  </div>
</div>
