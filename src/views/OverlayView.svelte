<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<style>
  .textAnimation {
    animation: 3s textAni ease;
  }

  @keyframes textAni {
    0% {
      opacity: 0;
    }
    3% {
      opacity: 1;
    }
    97% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
</style>

<!-- Use as a container for items that are supposed to be at the top of the DOM. -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import { message, state } from '../script/stores/uiStore';
  import ReconnectPrompt from '../components/ReconnectPrompt.svelte';
  import { isInputPatternValid } from '../script/stores/connectionStore';

  // Helps show error messages on top of page
  let latestMessage = '';
  let showLatestMessage = false;
  let latestMessageTimeout: NodeJS.Timeout;

  // In case of a message. Show the message at the top of screen
  // After 3 seconds. Hide the message again
  $: showMessage($message);

  function showMessage(msg: { warning: boolean; text: string }): void {
    if (!msg.warning) {
      return;
    }

    latestMessage = msg.text;
    showLatestMessage = true;

    if (latestMessageTimeout) {
      clearTimeout(latestMessageTimeout);
    }
    latestMessageTimeout = setTimeout(() => {
      showLatestMessage = false;
    }, 3000);
  }
</script>

<div>
  {#if showLatestMessage}
    <div transition:fade class="absolute mt-2 w-full z-100 textAnimation">
      <div class="flex justify-center">
        <p
          class="text-red-600 text-center shadow-lg text-2xl m-2 p-5 w-max bg-white rounded-xl border border-solid border-warm-gray-400">
          {latestMessage}
        </p>
      </div>
    </div>
  {/if}
  <ReconnectPrompt isOpen={$state.offerReconnect && isInputPatternValid()} />
</div>
