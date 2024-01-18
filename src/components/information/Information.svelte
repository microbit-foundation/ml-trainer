<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { getInfoBoxColors } from './InformationComponentUtility';
  import InfoIcon from 'virtual:icons/ri/information-line';
  import { t } from '../../i18n';

  export let underlineIconText = true;
  export let boxOffset: { x: number; y: number } = { x: 0, y: 0 };
  export let width = 300;
  export let isLightTheme = true;
  // TODO: This makes the component a weird combination of a general component which can handle all kinds of
  //       children, and a component specialised for text. In my opinion (Jon) this should be split up into one general
  //       and one for text (which uses the general one)
  export let iconText: string | undefined = undefined;
  export let titleText: string | undefined = undefined;
  export let bodyText: string | undefined = undefined;
  export let isVisible: boolean = true;

  const colors = getInfoBoxColors(isLightTheme);

  let isOpen = false;

  let w: number;
  let h: number;

  let boxTop = 0;
  let boxLeft = 0;

  let domNode: HTMLElement;

  function openTooltip(): void {
    let domRect: DOMRect = domNode.getBoundingClientRect();
    boxTop = h + 5 + boxOffset.y + domRect.y; // hardcoded values to provide a 'nice' starting point
    boxLeft = w - 20 + boxOffset.x + domRect.x;
    if (width + boxOffset.x + domRect.x > window.innerWidth) {
      boxLeft = boxOffset.x + domRect.x - width - 5; // hardcoded values to provide a 'nice' starting point
    }
    isOpen = true;
  }

  function closeTooltip(): void {
    isOpen = false;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      isOpen = false;
    }
  }
</script>

<div class={$$restProps.class || ''} class:invisible={!isVisible}>
  <div
    class="w-auto inline-flex"
    bind:clientWidth={w}
    bind:clientHeight={h}
    bind:this={domNode}>
    {#if iconText !== undefined}
      <p
        class="text-white w-auto h-auto mr-0 whitespace-pre-line pr-1"
        class:underline={underlineIconText}
        style="color: {colors.iconTextColor}">
        {iconText}
      </p>
    {/if}
    <div class="flex flex-col justify-center">
      <button
        on:focusin={openTooltip}
        on:focusout={closeTooltip}
        on:mouseenter={openTooltip}
        on:mouseleave={closeTooltip}
        on:keydown={onKeyDown}
        on:click={openTooltip}
        aria-label={$t('info.label', { values: { item: titleText } })}
        class="flex items-center cursor-pointer rounded-full outline-none focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:ring-ring"
        style="color: {colors.iconTextColor}">
        <InfoIcon />
      </button>
    </div>

    {#if isOpen}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <!-- on:click for stopping propogation  -->
      <div
        class="fixed z-10 rounded-md p-3 cursor-default"
        style="top: {boxTop}px; left: {boxLeft}px; width: {width}px; background-color:{colors.backgroundColor}"
        on:click|stopPropagation>
        {#if titleText}
          <p
            class="font-bold text-left mb-1 mt-1 text-sm"
            style="color: {colors.textColor}">
            {titleText}
          </p>
        {/if}
        {#if bodyText}
          <p
            class="text-sm text-left"
            style="color: {colors.textColor}"
            class:blackText={isLightTheme}
            class:whiteText={!isLightTheme}>
            {bodyText}
          </p>
        {/if}
        <slot />
      </div>
    {/if}
  </div>
</div>
