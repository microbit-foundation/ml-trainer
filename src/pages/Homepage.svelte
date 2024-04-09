<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<style>
  .tile-img {
    width: 200px;
  }
</style>

<script lang="ts">
  import {
    compatibility,
    isCompatibilityWarningDialogOpen,
    state,
  } from '../script/stores/uiStore';
  import trainModelImage from '../imgs/TrainModel.svg';
  import inputDataImage from '../imgs/InputData.svg';
  import testModelImage from '../imgs/TestModel.svg';
  import resourceImage from '../imgs/collecting_clap_data.png';
  import FrontPageContentTile from '../components/FrontPageContentTile.svelte';
  import StandardButton from '../components/StandardButton.svelte';
  import { t } from '../i18n';
  import { startConnectionProcess } from '../script/stores/connectDialogStore';
  import HtmlFormattedMessage, {
    linkWithProps,
  } from '../components/HtmlFormattedMessage.svelte';
  import LinkOverlayContainer from '../components/LinkOverlayContainer.svelte';
  import LinkOverlay from '../components/LinkOverlay.svelte';
  import { Paths, getTitle, navigate } from '../router/paths';
  import { gestures } from '../script/stores/Stores';
  import StandardDialog from '../components/dialogs/StandardDialog.svelte';
  import { clearGestures } from '../script/stores/mlStore';
  import { get } from 'svelte/store';

  $: hasExistingSession = $gestures.some(g => g.name || g.recordings.length);
  let showDataLossWarning = false;

  const { bluetooth, usb } = get(compatibility);
  const isIncompatible = !bluetooth && !usb;

  const openCompatibityWarningDialog = () => isCompatibilityWarningDialogOpen.set(true);

  const onClickStartNewSession = () => {
    if (isIncompatible) {
      openCompatibityWarningDialog();
      return;
    }
    if (hasExistingSession) {
      showDataLossWarning = true;
    } else {
      handleNewSession();
    }
  };
  const handleNewSession = () => {
    clearGestures();
    if ($state.isInputConnected) {
      navigate(Paths.DATA);
    } else {
      showDataLossWarning = false;
      startConnectionProcess();
    }
  };

  $: title = getTitle(Paths.HOME, $t);

  const steps = [
    {
      titleId: 'content.index.toolProcessCards.data.title',
      path: Paths.DATA,
      imgSrc: inputDataImage,
      descriptionId: 'content.index.toolProcessCards.data.description',
    },
    {
      titleId: 'content.index.toolProcessCards.train.title',
      path: Paths.TRAINING,
      imgSrc: trainModelImage,
      descriptionId: 'content.index.toolProcessCards.train.description',
    },
    {
      titleId: 'content.index.toolProcessCards.model.title',
      path: Paths.MODEL,
      imgSrc: testModelImage,
      descriptionId: 'content.index.toolProcessCards.model.description',
    },
  ];

  const resources = [
    {
      title: 'Introducing the micro:bit machine learning tool',
      path: Paths.INTRODUCING_TOOL,
      imgSrc: resourceImage,
    },
    {
      title: 'Get started',
      path: Paths.GET_STARTED,
      imgSrc: resourceImage,
    },
  ];
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<main class="h-full flex flex-col items-center bg-backgrounddark">
  <h1 class="sr-only">{$t('content.index.title')}</h1>
  <div class="flex flex-col mb-8 gap-5">
    <div class="flex flex-col items-center justify-center m-10 gap-10">
      <div class="flex flex-col items-center justify-center gap-5">
        <h1 class="text-4xl font-bold">micro:bit machine learning tool</h1>
        <p class="text-xl">
          Introduce students to machine learning concepts through physical movement and
          data
        </p>
      </div>
      <div class="flex flex-col flex-wrap items-center max-w-325">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {#each steps as step, idx}
            <LinkOverlayContainer>
              <FrontPageContentTile>
                <LinkOverlay
                  onClickOrHrefOrPath={isIncompatible
                    ? openCompatibityWarningDialog
                    : step.path}
                  class="mb-5">
                  <h3 class="text-center text-2xl font-bold">
                    {idx + 1}. {$t(step.titleId)}
                  </h3>
                </LinkOverlay>
                <img class="mb-5 tile-img" alt="" src={step.imgSrc} />
                <p class="text-center">
                  {$t(step.descriptionId)}
                </p>
              </FrontPageContentTile>
            </LinkOverlayContainer>
          {/each}
        </div>
      </div>
    </div>

    <div class="flex flex-col flex-wrap items-center max-w-325">
      <h2 class="text-3xl px-10 lg:self-start font-bold">Resources</h2>
      <div class="grid grid-cols-1 lg:grid-cols-3 p-10 gap-5">
        {#each resources as resource}
          <LinkOverlayContainer>
            <div
              class="flex flex-col flex-wrap items-center border-gray-200 border border-solid bg-white rounded-xl shadow-md max-w-88 h-full">
              <img class="w-full rounded-t-xl" alt="" src={resource.imgSrc} />
              <LinkOverlay onClickOrHrefOrPath={resource.path}>
                <h3 class="text-center text-lg font-bold m-3">
                  {resource.title}
                </h3>
              </LinkOverlay>
            </div>
          </LinkOverlayContainer>
        {/each}
      </div>
    </div>

    <div class="flex items-center justify-center gap-x-5">
      {#if hasExistingSession}
        <StandardButton size="large" type="primary" onClick={() => navigate(Paths.DATA)}
          >{$t('footer.resume')}</StandardButton>
      {/if}
      <StandardButton
        size="large"
        type={hasExistingSession ? 'secondary' : 'primary'}
        onClick={onClickStartNewSession}>{$t('footer.start')}</StandardButton>
    </div>
  </div>
</main>

<StandardDialog
  isOpen={showDataLossWarning}
  onClose={() => (showDataLossWarning = false)}
  class="w-150 space-y-5">
  <svelte:fragment slot="heading">
    {$t('content.index.dataWarning.title')}
  </svelte:fragment>
  <svelte:fragment slot="body">
    <div slot="body" class="space-y-5">
      <p>{$t('content.index.dataWarning.subtitleOne')}</p>
      <p>
        <HtmlFormattedMessage
          id="content.index.dataWarning.subtitleTwo"
          options={{
            values: {
              link: linkWithProps({
                href:
                  'data:application/json;charset=utf-8,' +
                  encodeURIComponent(JSON.stringify(get(gestures), null, 2)),
                download: 'dataset.json',
              }),
            },
          }} />
      </p>
      <div class="flex justify-end items-center gap-x-5">
        <StandardButton onClick={handleNewSession} type="primary"
          >{$t('footer.start')}</StandardButton>
      </div>
    </div>
  </svelte:fragment>
</StandardDialog>
