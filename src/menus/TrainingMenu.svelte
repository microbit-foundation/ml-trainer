<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { slide } from 'svelte/transition';
  import { state } from '../script/stores/uiStore';
  import { t } from '../i18n';
  import ImageSkeleton from '../components/skeletonloading/ImageSkeleton.svelte';
  import modelImage from '../imgs/model_blue.svg';
</script>

<div class="h-40 w-40 m-auto mt-2 flex flex-col justify-center">
  {#if $state.isPredicting}
    <div class="text-white text-center flex flex-col justify-center items-center">
      <ImageSkeleton
        alt="Model Icon"
        src={modelImage}
        height={100}
        width={100}
        loadingColorPrimary="#68BDBF"
        loadingColorSecondary="#3C81F6" />
      <p class="text-white mt-3 mb-4">
        {$t('content.trainer.trainingFinished.title')}
      </p>
    </div>
  {:else}
    <div
      class="h-34 w-34 m-auto mb-8 border-2 border-white border-opacity-30 rounded-lg border-dashed font-bold text-warm-gray-300">
      <div class="flex h-full">
        <div class="m-auto">
          {$t('menu.model.noModel')}
        </div>
      </div>
    </div>
  {/if}
</div>
