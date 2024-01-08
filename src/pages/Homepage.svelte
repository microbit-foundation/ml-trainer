<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import trainModelImage from '../imgs/TrainModel.svg';
  import inputDataImage from '../imgs/InputData.svg';
  import testModelImage from '../imgs/TestModel.svg';
  import FrontPageContentTile from '../components/FrontPageContentTile.svelte';
  import StandardButton from '../components/StandardButton.svelte';
  import { t } from '../i18n';
  import { startConnectionProcess } from '../script/stores/connectDialogStore';
  import ConnectDialogContainer from '../components/connection-prompt/ConnectDialogContainer.svelte';
  import { parseTag } from '../parseTag';

  // Avoid youtube cookie. rel=0 should limit related videos to youtube channel.
  // Once we have translated videos we can try e.g. cc_lang_pref=fr
  // but we'll need to check our codes match theirs.
  const introVideoUrl =
    // TODO: Replace placeholder youtube video id
    'https://www.youtube-nocookie.com/embed/u2u7UJSRuko?rel=0&cc_load_policy=1';

  const playgroundSurveyUrl =
    'https://stage.microbit.org/teach/playground-survey/exploring-machine-learning';

  const tileImageSize = '300';

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
        {#each parseTag($t('content.index.toolInfo'), 'link') as { tag, text }}
          {#if tag}
            <a class="text-link" href={playgroundSurveyUrl} target="_blank">{text}</a>
          {:else}
            {text}
          {/if}
        {/each}
      </p>
    </div>

    <div class="flex flex-col flex-wrap items-center max-w-325">
      <h2 class="text-3xl px-10 lg:self-start font-bold">
        {$t('content.index.toolProcessCards.main.title')}
      </h2>
      <div class="grid grid-cols-1 lg:grid-cols-3 p-10 gap-5">
        <FrontPageContentTile>
          <h3 class="text-center text-2xl mb-5 font-bold">
            {$t('content.index.toolProcessCards.data.title')}
          </h3>
          <img class="mb-5" alt="add data" src={inputDataImage} width={tileImageSize} />
          <p class="text-center">
            {$t('content.index.toolProcessCards.data.description')}
          </p>
        </FrontPageContentTile>

        <FrontPageContentTile>
          <h3 class="text-center text-2xl mb-5 font-bold">
            {$t('content.index.toolProcessCards.train.title')}
          </h3>
          <img
            class="mb-5"
            alt="train model"
            src={trainModelImage}
            width={tileImageSize} />
          <p class="text-center">
            {$t('content.index.toolProcessCards.train.description')}
          </p>
        </FrontPageContentTile>

        <FrontPageContentTile>
          <h3 class="text-center text-2xl mb-5 font-bold">
            {$t('content.index.toolProcessCards.model.title')}
          </h3>
          <img class="mb-5" alt="test model" src={testModelImage} width={tileImageSize} />
          <p class="text-center">
            {$t('content.index.toolProcessCards.model.description')}
          </p>
        </FrontPageContentTile>
      </div>
    </div>

    <StandardButton size="large" type="primary" onClick={startConnectionProcess}
      >{$t('footer.connectButtonNotConnected')}</StandardButton>
  </div>
</main>
