<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<style>
  /* Styling slot elements */
  .slot :global(h2) {
    font-size: 1.8rem;
    line-height: 2rem;
    font-weight: bold;
    margin-top: 2rem;
  }
  .slot :global(h2):first-child {
    margin-top: 0;
  }
  .slot :global(h3) {
    font-size: 1.2rem;
    line-height: 2rem;
    font-weight: bold;
    margin-top: 1.5rem;
  }

  .slot :global(li) {
    margin-top: 0.5em;
  }

  .slot :global(p) {
    margin-top: 1em;
  }

  .slot :global(img) {
    margin-top: 1em;
  }
</style>

<script lang="ts">
  import ChevronArror from 'virtual:icons/ri/arrow-drop-right-line';
  import { Paths } from '../router/paths';

  export let title: string;
</script>

<main class="h-full flex flex-col items-center bg-backgrounddark">
  <div class="flex flex-col max-w-1084px lg:w-3/4 md:w-4/5 p-10 gap-5">
    <div class="flex flex-col gap-5">
      <div class="flex flex-row">
        <a href={Paths.HOME} class="text-lg hover:underline">Home</a>
        <ChevronArror class="h-full text-2xl" />
        <p class="text-lg">
          {title}
        </p>
      </div>
      <h1 class="text-4xl font-bold">{title}</h1>
    </div>
    <!-- TODO: Add video -->
    <!-- <div class="flex flex-col items-center justify-center gap-5">
      <iframe
        class="lg:w-3/4 md:w-full h-auto aspect-video"
        style="aspect-ratio: 16/9"
        src={`https://www.youtube-nocookie.com/embed/ZhUtuuQemFc?rel=0`}
        allow="encrypted-media"
        frameBorder="0"
        allowFullScreen>
      </iframe>
    </div> -->
    <div class="w-full bg-backgroundlight p-30px rounded-lg shadow-xl">
      <div class="flex flex-col lg:max-w-3/4 slot">
        <slot />
      </div>
    </div>
  </div>
</main>
