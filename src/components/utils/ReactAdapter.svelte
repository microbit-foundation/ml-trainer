<!--
  (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script>
  import React from 'react';
  import { createRoot } from 'react-dom/client';
  import { onDestroy, onMount } from 'svelte';

  // Based on https://pandemicode.dev/using-react-within-your-svelte-applications-3b1f2a75aefc
  // TODO: Probably not what we want to do in terms of using React in Svelte.

  let container;
  let root;

  const { el, children, class: _, ...props } = $$props;
  const element = React.createElement(el, props, children);

  onMount(() => {
    root = createRoot(container);
    try {
      root.render(element);
    } catch (err) {
      console.warn(`react-adapter failed to mount.`, { err });
    }
  });

  onDestroy(() => {
    try {
      container && root && root.unmount();
    } catch (err) {
      console.warn(`react-adapter failed to unmount.`, { err });
    }
  });
</script>

<div bind:this={container} class={$$props.class} />
