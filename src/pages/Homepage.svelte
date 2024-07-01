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
  import FrontPageContentTile from '../components/FrontPageContentTile.svelte';
  import LinkOverlay from '../components/LinkOverlay.svelte';
  import LinkOverlayContainer from '../components/LinkOverlayContainer.svelte';
  import StartResumeActions from '../components/StartResumeActions.svelte';
  import { t } from '../i18n';
  import addDataImage from '../imgs/add_data.svg';
  import resourceGetStartedImage from '../imgs/resource-get-started.jpg';
  import resourceIntroducingToolImage from '../imgs/resource-introducing-tool.jpg';
  import testModelImage from '../imgs/test_model_blue.svg';
  import trainModelImage from '../imgs/train_model_blue.svg';
  import { Paths, getTitle } from '../router/paths';

  $: title = getTitle(Paths.HOME, $t);

  const steps = [
    {
      titleId: 'content.index.toolProcessCards.data.title',
      path: Paths.DATA,
      imgSrc: addDataImage,
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
    {
      titleId: 'content.index.toolProcessCards.output.title',
      path: Paths.OUTPUT,
      imgSrc: testModelImage,
      descriptionId: 'content.index.toolProcessCards.output.description',
    },
  ];

  const resources = [
    {
      title: 'Introducing the micro:bit machine learning tool',
      path: Paths.INTRODUCING_TOOL,
      imgSrc: resourceIntroducingToolImage,
    },
    {
      title: 'Get started',
      path: Paths.GET_STARTED,
      imgSrc: resourceGetStartedImage,
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
      <div class="flex flex-col flex-wrap items-center max-w-325 w-full">
        <div
          class="flex flex-col lg:flex-row items-center justify-between w-full px-10 gap-5">
          {#each steps as step, idx}
            <div class="flex flex-col flex-wrap items-center sp max-w-70">
              <h3 class="text-center text-2xl font-bold mb-5">
                {idx + 1}. {$t(step.titleId)}
              </h3>
              <img class="mb-5 tile-img" alt="" src={step.imgSrc} />
              <p class="text-center">
                {$t(step.descriptionId)}
              </p>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="flex flex-col flex-wrap items-center max-w-325">
      <h2 class="text-3xl px-10 lg:self-start font-bold">Resources</h2>
      <div class="grid grid-cols-1 lg:grid-cols-3 p-10 gap-5">
        {#each resources as resource}
          <LinkOverlayContainer>
            <FrontPageContentTile>
              <img class="w-full rounded-t-xl" alt="" src={resource.imgSrc} />
              <LinkOverlay onClickOrHrefOrPath={resource.path}>
                <h3 class="text-lg font-bold m-3">
                  {resource.title}
                </h3>
              </LinkOverlay>
            </FrontPageContentTile>
          </LinkOverlayContainer>
        {/each}
      </div>
    </div>

    <StartResumeActions class="justify-center" buttonSize="large" />
  </div>
</main>
