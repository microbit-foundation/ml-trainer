<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { ModelView, state } from '../../script/stores/uiStore';
  import ModelPageStackView from './stackview/ModelPageStackView.svelte';
  import ModelPageTileView from './tileview/ModelPageTileView.svelte';
</script>

{#if $state.modelView == ModelView.TILE}
  <ModelPageTileView />
{:else}
  <ModelPageStackView />
{/if}
