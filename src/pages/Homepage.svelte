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

  const introVideoUrl =
    'https://datatraener0dr0media-euno.streaming.media.azure.net/18233c69-2bc3-4b1b-9e2d-249e37b56307/Ultrabit_01_Introvideo_Datatræneren.mp4';

  const tileImageSize = '300';

  let connectDialogReference: ConnectDialogContainer;
</script>

<main class="h-full flex flex-col bg-backgrounddark">
  <div class="overflow-x-auto mb-8">
    <ConnectDialogContainer bind:this={connectDialogReference} />

    <div class="flex flex-col items-center justify-center m-10">
      <video class="w-150 mb-5" controls width="550">
        <source src={introVideoUrl} type="video/mp4" />
      </video>
      <p>
        {$t('content.index.toolInfo1')}
        <a class="text-link" href="" target="_blank">{$t('content.index.toolInfo2')}</a>
      </p>
    </div>

    <div class="flex flex-col flex-wrap items-center">
      <h1 class="text-3xl px-10 w-325">
        {$t('content.index.toolProcessCards.main.title')}
      </h1>
      <div class="flex justify-between p-10 gap-5 w-325">
        <FrontPageContentTile>
          <h2 class="text-center text-3xl mb-5">
            {$t('content.index.toolProcessCards.data.title')}
          </h2>
          <img class="mb-5" alt="add data" src={inputDataImage} width={tileImageSize} />
          <p class="text-center w-75">
            {$t('content.index.toolProcessCards.data.description')}
          </p>
        </FrontPageContentTile>

        <FrontPageContentTile>
          <h2 class="text-center text-3xl mb-5">
            {$t('content.index.toolProcessCards.train.title')}
          </h2>
          <img
            class="mb-5"
            alt="train model"
            src={trainModelImage}
            width={tileImageSize} />
          <p class="text-center w-75">
            {$t('content.index.toolProcessCards.train.description')}
          </p>
        </FrontPageContentTile>

        <FrontPageContentTile>
          <h2 class="text-center text-3xl mb-5">
            {$t('content.index.toolProcessCards.model.title')}
          </h2>
          <img class="mb-5" alt="test model" src={testModelImage} width={tileImageSize} />
          <p class="text-center w-75">
            {$t('content.index.toolProcessCards.model.description')}
          </p>
        </FrontPageContentTile>
      </div>
    </div>

    <StandardButton size="large" color="primary" onClick={startConnectionProcess}
      >{$t('footer.connectButtonNotConnected')}</StandardButton>
  </div>
</main>
