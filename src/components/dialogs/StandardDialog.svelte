<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { CreateDialogProps, createDialog, createSync, melt } from '@melt-ui/svelte';
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import CloseIcon from 'virtual:icons/ri/close-line';
  import { t } from '../../i18n';
  import IconButton from '../IconButton.svelte';
  export let hasCloseButton = true;
  export let createDialogPropsOverride: CreateDialogProps = {};
  export let isOpen: boolean;
  export let onClose: () => void;
  export let title: string | undefined = undefined;
  export let titleClass: string | undefined = undefined;

  let finalFocusRef: Element | null;

  const onOpenDialog = () => {
    finalFocusRef = document.activeElement;
  };

  const onCloseDialog = () => {
    if (finalFocusRef) {
      (finalFocusRef as HTMLElement).focus();
    }
    onClose();
  };

  const onOpenChange: CreateDialogProps['onOpenChange'] = ({ next }) => {
    if (!next) {
      onCloseDialog();
    } else {
      onOpenDialog();
    }
    return next;
  };

  const {
    elements: { overlay, content, title: titleElement, close, portalled },
    states,
  } = createDialog({
    forceVisible: true,
    preventScroll: true,
    closeOnOutsideClick: true,
    closeOnEscape: true,
    onOpenChange,
    ...createDialogPropsOverride,
  });

  const { open } = states;

  // Syncing inside and outside component states to minimise prop changes
  const sync = createSync(states);
  $: sync.open(isOpen, v => (isOpen = v));

  $: if (isOpen) {
    onOpenDialog();
  } else {
    onCloseDialog();
  }
</script>

<div class="fixed z-10" use:melt={$portalled}>
  {#if $open}
    <div
      class="fixed top-0 left-0 h-screen w-screen flex justify-center items-center bg-black/50 bg-blend-darken"
      use:melt={$overlay}
      transition:fade={{ duration: 100 }}>
      <div
        use:melt={$content}
        class="w-min h-min border-gray-200 border border-solid relative bg-white rounded-lg p-8 z-15"
        transition:scale={{
          duration: 200,
          start: 0.9,
          easing: quintOut,
        }}>
        {#if hasCloseButton}
          <div class="absolute right-2 top-2">
            <IconButton
              {...$close}
              useAction={$close.action}
              ariaLabel={$t('actions.close')}>
              <CloseIcon class="text-xl m-1" />
            </IconButton>
          </div>
        {/if}
        <div class={$$restProps.class || ''}>
          {#if title}
            <h2 use:melt={$titleElement} class={titleClass || 'text-xl font-bold pb-5'}>
              {title}
            </h2>
          {/if}
          <slot />
        </div>
      </div>
    </div>
  {/if}
</div>
