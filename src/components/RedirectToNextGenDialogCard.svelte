<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import LinkOverlay from './LinkOverlay.svelte';
  import LinkOverlayContainer from './LinkOverlayContainer.svelte';

  export let title: string;
  export let imgSrc: string;
  export let onClickOrHrefOrPath: string | (() => void);
</script>

<LinkOverlayContainer>
  <div
    class="flex flex-col flex-wrap border-gray-200 border-5 border-solid bg-white rounded-md p-3 space-y-5">
    <LinkOverlay {onClickOrHrefOrPath}>
      <p class="font-bold">{title}</p>
    </LinkOverlay>
    <img class="mb-5" alt="" src={imgSrc} />
  </div>
</LinkOverlayContainer>
