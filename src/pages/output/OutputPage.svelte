<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import OutputProgramMicrobitView from './OutputProgramMicrobitView.svelte';
  import { state } from '../../script/stores/uiStore';
  import { t } from '../../i18n';
  import TabView from '../../views/TabView.svelte';
  import { Paths, getTitle } from '../../router/paths';
  import TrainModelFirstTitle from '../../components/TrainModelFirstTitle.svelte';

  $: title = getTitle(Paths.OUTPUT, $t);
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<div class="flex flex-col items-center pb-5 bg-backgrounddark h-full">
  <TabView />
  <main class="flex flex-col w-full h-full text-center items-center">
    {#if $state.isPredicting}
      <OutputProgramMicrobitView />
    {:else}
      <TrainModelFirstTitle headingId="content.output.header" />
    {/if}
  </main>
</div>
