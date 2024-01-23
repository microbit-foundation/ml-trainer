<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { CreateDialogProps, createDialog, createSync } from '@melt-ui/svelte';
  import CloseIcon from 'virtual:icons/ri/close-line';
  import Transition from 'svelte-transition';
  import { t } from '../../i18n';
  import IconButton from '../IconButton.svelte';
  export let hasCloseButton = true;
  export let createDialogPropsOverride: CreateDialogProps = {};
  export let isOpen: boolean;
  export let onClose: () => void;
  export let title: string | undefined = undefined;
  export let titleClass: string | undefined = undefined;

  const onOpenChange: CreateDialogProps['onOpenChange'] = ({ curr, next }) => {
    // if dialog is closing
    if (!next) {
      onClose();
    }
    return next;
  };

  const {
    elements: { overlay, content, title: titleElement, close, portalled },
    states,
  } = createDialog({
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
</script>

<div class="fixed z-10" {...$portalled} use:$portalled.action>
  {#if $open}
    <Transition show={$open}>
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <!-- Keyboard event handler for on:click is implemented as part of svelte-headlessui dialog builder  -->
      <div
        class="fixed top-0 left-0 h-screen w-screen flex justify-center items-center bg-black/50 bg-blend-darken"
        {...$overlay}
        use:$overlay.action>
        <Transition
          show={$open}
          enter="transition ease-out duration-200"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95">
          <div
            {...$content}
            use:$content.action
            class="w-min h-min border-gray-200 border border-solid relative bg-white rounded-lg p-8 z-15">
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
                <h2
                  {...$titleElement}
                  use:titleElement
                  class={titleClass || 'text-xl font-bold pb-5'}>
                  {title}
                </h2>
              {/if}
              <slot />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  {/if}
</div>
