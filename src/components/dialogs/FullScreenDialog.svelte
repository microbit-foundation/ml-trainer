<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<!-- Mostly a duplication between StandardDialog.svelte -->
<script lang="ts">
  import { CreateDialogProps, createDialog, createSync, melt } from '@melt-ui/svelte';
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { onDestroy } from 'svelte';

  export let closeOnOutsideClick: boolean = true;
  export let closeOnEscape: boolean = true;
  export let isOpen: boolean;
  export let onClose: () => void;
  export let hideContent: boolean = false;

  let finalFocusRef: Element | null;

  const onOpenDialog = () => {
    finalFocusRef = document.activeElement;
  };

  const onCloseDialog = () => {
    onClose();
    if (finalFocusRef) {
      (finalFocusRef as HTMLElement).focus();
    }
  };

  const onOpenChange: CreateDialogProps['onOpenChange'] = ({ curr, next }) => {
    // Use curr so we don't call onCloseDialog() on page load.
    if (curr && !next) {
      onCloseDialog();
    } else if (!curr && next) {
      onOpenDialog();
    }
    return next;
  };

  const {
    elements: { overlay, content, title, close, portalled },
    states,
  } = createDialog({
    forceVisible: true,
    preventScroll: true,
    closeOnOutsideClick,
    closeOnEscape: false,
    onOpenChange,
  });

  const keyListener = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      onCloseDialog();
    }
  };

  $: {
    if (closeOnEscape) {
      document.addEventListener('keydown', keyListener);
    } else {
      document.removeEventListener('keydown', keyListener);
    }
  }

  const { open } = states;

  // Syncing inside and outside component states to minimise prop changes
  const sync = createSync(states);
  $: sync.open(isOpen, v => (isOpen = v));

  let prevOpen: boolean;
  $: if (!prevOpen && isOpen) {
    onOpenDialog();
    prevOpen = isOpen;
  } else if (prevOpen && !isOpen) {
    // Use prevOpen so we don't call onCloseDialog() on page load.
    prevOpen = isOpen;
    onCloseDialog();
  }

  onDestroy(() => document.removeEventListener('keydown', keyListener));
</script>

<!-- z-index of this dialog needs to be less than the standard dialog -->
<div class="fixed z-5" use:melt={$portalled}>
  {#if $open}
    <div
      class="fixed top-0 left-0 h-screen w-screen flex justify-center items-center bg-black/50 bg-blend-darken"
      use:melt={$overlay}
      transition:fade={{ duration: 100 }}>
      <div
        use:melt={$content}
        class="w-full h-full relative bg-white z-15"
        class:hidden={hideContent}
        transition:scale={{
          duration: 200,
          start: 0.9,
          easing: quintOut,
        }}>
        <div class={$$restProps.class || ''}>
          <slot name="body" />
        </div>
      </div>
    </div>
  {/if}
</div>
