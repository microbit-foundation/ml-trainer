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
  import { state } from '../script/stores/uiStore';
  import trainModelImage from '../imgs/TrainModel.svg';
  import inputDataImage from '../imgs/InputData.svg';
  import testModelImage from '../imgs/TestModel.svg';
  import FrontPageContentTile from '../components/FrontPageContentTile.svelte';
  import StandardButton from '../components/StandardButton.svelte';
  import { t } from '../i18n';
  import { startConnectionProcess } from '../script/stores/connectDialogStore';
  import ConnectDialogContainer from '../components/connection-prompt/ConnectDialogContainer.svelte';
  import HtmlFormattedMessage, {
    linkWithProps,
  } from '../components/HtmlFormattedMessage.svelte';
  import LinkOverlayContainer from '../components/LinkOverlayContainer.svelte';
  import LinkOverlay from '../components/LinkOverlay.svelte';
  import { Paths, navigate } from '../router/paths';

  // Avoid youtube cookie. rel=0 should limit related videos to youtube channel.
  // Once we have translated videos we can try e.g. cc_lang_pref=fr
  // but we'll need to check our codes match theirs.
  const introVideoUrl =
    // TODO: Replace placeholder youtube video id
    'https://www.youtube-nocookie.com/embed/u2u7UJSRuko?rel=0&cc_load_policy=1';

  const playgroundSurveyUrl =
    'https://stage.microbit.org/teach/playground-survey/exploring-machine-learning';

  let connectDialogReference: ConnectDialogContainer;
</script>

<main class="h-full flex flex-col items-center bg-backgrounddark">
  <h1 class="sr-only">{$t('content.index.title')}</h1>
  <div class="mb-8">
    <ConnectDialogContainer bind:this={connectDialogReference} />

    <div class="flex flex-col items-center justify-center m-10 gap-5">
      <iframe
        class="w-38rem h-auto aspect-video"
        style="aspect-ratio: 16/9"
        title="introduction video"
        src={introVideoUrl}
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
            <LinkOverlay path={Paths.DATA} class="mb-5">
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
            <LinkOverlay path={Paths.TRAINING} class="mb-5">
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
            <LinkOverlay path={Paths.MODEL} class="mb-5">
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

    <StandardButton size="large" type="primary" onClick={startConnectionProcess}
      >{$t('footer.connectButtonNotConnected')}</StandardButton>
  </div>
</main>
