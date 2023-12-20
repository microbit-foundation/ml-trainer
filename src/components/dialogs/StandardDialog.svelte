<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { createDialog } from 'svelte-headlessui';
  import Transition from 'svelte-transition';

  export let hasCloseButton = true;
  export let isOpen: boolean;
  export let onClose: () => void;
  export let ariaLabel: string | undefined = undefined;

  const dialog = createDialog({ label: ariaLabel });

  // Updating inside and outside component states to minimise prop changes
  // of using svelte-headlessui dialogs
  $: if (isOpen) {
    dialog.open();
  }
  dialog.subscribe(({ expanded }) => {
    if (!expanded) {
      onClose();
    }
  });
</script>

<div class="relative z-10">
  <Transition show={$dialog.expanded}>
    <div
      class="fixed top-0 left-0 h-screen w-screen flex justify-center items-center bg-black/50 bg-blend-darken">
      <Transition
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95">
        <div
          class="w-min h-min border-gray-200 border border-solid relative bg-white rounded-lg p-8"
          use:dialog.modal>
          {#if hasCloseButton}
            <div class="absolute right-2 top-2">
              <button
                type="button"
                class="hover:bg-gray-100 rounded w-8 svelte-1rnkjvh focus-visible:ring-blue-500"
                on:click={dialog.close}>
                <i
                  class="fas fa-plus text-lg text-gray-600 hover:text-gray-800 duration-75 svelte-1rnkjvh"
                  style="transform: rotate(45deg);" />
              </button>
            </div>
          {/if}
          <div class="m-1 {hasCloseButton ? 'mt-3' : 'mt-1'}">
            <slot />
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</div>
