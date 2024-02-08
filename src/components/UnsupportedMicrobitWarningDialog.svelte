<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../i18n';
  import DialogHeading from './DialogHeading.svelte';
  import HtmlFormattedMessage, { linkWithProps } from './HtmlFormattedMessage.svelte';
  import StandardButton from './StandardButton.svelte';

  export let onClose: () => void;
  export let onStartBluetoothClick: () => void;

  const linkWithPropsForMicrobitVersionSupport = linkWithProps({
    href: 'https://support.microbit.org/support/solutions/articles/19000119162',
    target: '_blank',
    rel: 'noopener',
  });
  const linkToBluetoothFlowId = 'link-to-bluetooth';
  const linkToBluetoothFlow = linkWithProps(
    {
      id: linkToBluetoothFlowId,
    },
    { tag: 'button' },
  );
  // The elements in translated strings don't support Svelte event handlers
  // so we wire it up ourselves.
  const wireLinkToBluetoothFlow = (node: Element) => {
    const link = node.querySelector('#' + linkToBluetoothFlowId);
    link?.addEventListener('click', onStartBluetoothClick);
    return {
      destroy() {
        link?.removeEventListener('click', onStartBluetoothClick);
      },
    };
  };
</script>

<div class="w-175">
  <DialogHeading>{$t('connectMB.unsupportedMicrobit.header')}</DialogHeading>
  <div class="space-y-5">
    <div class="space-y-2">
      <p>
        <HtmlFormattedMessage
          id={$t('connectMB.unsupportedMicrobit.explain')}
          options={{
            values: {
              link: linkWithPropsForMicrobitVersionSupport,
            },
          }} />
      </p>
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <p use:wireLinkToBluetoothFlow>
        <HtmlFormattedMessage
          id={$t('connectMB.unsupportedMicrobit.advice')}
          options={{
            values: {
              link1: linkToBluetoothFlow,
              link2: linkWithPropsForMicrobitVersionSupport,
            },
          }} />
      </p>
    </div>
    <div class="flex justify-end">
      <StandardButton onClick={onClose} type="primary"
        >{$t('actions.close')}</StandardButton>
    </div>
  </div>
</div>
