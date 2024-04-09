<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { Paths } from '../router/paths';
  import ChevronArror from 'virtual:icons/ri/arrow-drop-right-line';

  export let title: string;
</script>

<main class="h-full flex flex-col items-center bg-backgrounddark">
  <div class="flex flex-col max-w-1084px lg:w-3/4 md:w-4/5 p-10 gap-10">
    <div class="flex flex-col gap-5">
      <div class="flex flex-row">
        <a href={Paths.HOME} class="text-lg hover:underline">Home</a>
        <ChevronArror class="h-full text-2xl" />
        <p class="text-lg">
          {title}
        </p>
      </div>
      <h1 class="text-3xl font-bold">{title}</h1>
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
      <div class="flex flex-col lg:max-w-3/4 gap-5">
        <slot />
      </div>
    </div>
  </div>
</main>
