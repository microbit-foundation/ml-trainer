<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<style>
  .tile-img {
    width: 300px;
    height: 178.72px;
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
  import { locale as currentLocale } from 'svelte-i18n';
  import { get } from 'svelte/store';

  const playgroundSurveyUrl =
    'https://microbit.org/teach/playground-survey/exploring-machine-learning/';

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
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<main class="h-full flex flex-col items-center bg-backgrounddark">
  <h1 class="sr-only">{$t('content.index.title')}</h1>
  <div class="mb-8">
    <div class="flex flex-col items-center justify-center m-10 gap-5">
      <!-- Avoid youtube cookie. rel=0 should limit related videos to youtube channel.-->
      <iframe
        class="w-38rem h-auto aspect-video"
        style="aspect-ratio: 16/9"
        title={$t('homepage.introVideo')}
        src={`https://www.youtube-nocookie.com/embed/ZhUtuuQemFc?rel=0&cc_lang_pref=${$currentLocale}&cc_load_policy=1`}
        allow="encrypted-media"
        frameBorder="0"
        allowFullScreen>
      </iframe>
      <p>
        <HtmlFormattedMessage
          id="content.index.toolInfo"
          options={{
            values: {
              link: linkWithProps({
                href: playgroundSurveyUrl,
                target: '_blank',
                rel: 'noopener',
              }),
            },
          }} />
      </p>
    </div>

    <div class="flex flex-col flex-wrap items-center max-w-325">
      <h2 class="text-3xl px-10 lg:self-start font-bold">
        {$t('content.index.toolProcessCards.main.title')}
      </h2>
      <div class="grid grid-cols-1 lg:grid-cols-3 p-10 gap-5">
        <LinkOverlayContainer>
          <FrontPageContentTile>
            <LinkOverlay
              onClickOrHrefOrPath={isIncompatible
                ? openCompatibityWarningDialog
                : Paths.DATA}
              class="mb-5">
              <h3 class="text-center text-2xl font-bold">
                {$t('content.index.toolProcessCards.data.title')}
              </h3>
            </LinkOverlay>
            <img class="mb-5 tile-img" alt="" src={inputDataImage} />
            <p class="text-center">
              {$t('content.index.toolProcessCards.data.description')}
            </p>
          </FrontPageContentTile>
        </LinkOverlayContainer>

        <LinkOverlayContainer>
          <FrontPageContentTile>
            <LinkOverlay
              onClickOrHrefOrPath={isIncompatible
                ? openCompatibityWarningDialog
                : Paths.TRAINING}
              class="mb-5">
              <h3 class="text-center text-2xl font-bold">
                {$t('content.index.toolProcessCards.train.title')}
              </h3>
            </LinkOverlay>
            <img class="mb-5 tile-img" alt="" src={trainModelImage} />
            <p class="text-center">
              {$t('content.index.toolProcessCards.train.description')}
            </p>
          </FrontPageContentTile>
        </LinkOverlayContainer>

        <LinkOverlayContainer>
          <FrontPageContentTile>
            <LinkOverlay
              onClickOrHrefOrPath={isIncompatible
                ? openCompatibityWarningDialog
                : Paths.MODEL}
              class="mb-5">
              <h3 class="text-center text-2xl font-bold">
                {$t('content.index.toolProcessCards.model.title')}
              </h3>
            </LinkOverlay>
            <img class="mb-5 tile-img" alt="" src={testModelImage} />
            <p class="text-center">
              {$t('content.index.toolProcessCards.model.description')}
            </p>
          </FrontPageContentTile>
        </LinkOverlayContainer>
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
