<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import Bowser from 'bowser';
  import { onMount } from 'svelte';
  import { t } from '../../../../i18n';
  import transferProgramChromeOS from '../../../../imgs/transfer_program_chromeos.gif';
  import transferProgramMacOS from '../../../../imgs/transfer_program_macos.gif';
  import transferOutputProgram from '../../../../imgs/transfer_output.gif';
  import transferProgramWindows from '../../../../imgs/transfer_program_windows.gif';
  import { getHexFileUrl } from '../../../../script/microbit-interfacing/Microbits';
  import DialogHeading from '../../../DialogHeading.svelte';
  import HtmlFormattedMessage, {
    linkWithProps,
  } from '../../../HtmlFormattedMessage.svelte';
  import StandardButton from '../../../StandardButton.svelte';
  import { DeviceRequestStates } from '../../../../script/microbit-interfacing/MicrobitConnection';
  import { state } from '../../../../script/stores/uiStore';

  export let onNextClick: (() => void) | undefined;
  export let onBackClick: () => void;
  export let deviceState: DeviceRequestStates;

  let downloadLinkContainer: HTMLElement | undefined;

  onMount(() => downloadLinkContainer!.querySelector('a')!.click());

  const browser = Bowser.getParser(window.navigator.userAgent);
  const osName = browser.getOS().name ?? 'unknown';

  interface ImageProps {
    src: string;
    class: string;
  }

  // See https://github.com/lancedikson/bowser/blob/master/src/constants.js
  const getImageProps = (os: string): ImageProps => {
    if (deviceState === DeviceRequestStates.OUTPUT) {
      // TODO: Change gif depending on os
      return { src: transferOutputProgram, class: 'h-400px' };
    }
    switch (os) {
      case 'Chrome OS':
        return { src: transferProgramChromeOS, class: 'h-324px' };
      case 'Windows':
        return { src: transferProgramWindows, class: 'h-390px' };
      case 'macOS':
        return { src: transferProgramMacOS, class: 'h-387px' };
      default:
        return { src: transferProgramWindows, class: 'h-390px' };
    }
  };

  const imageProps = getImageProps(osName);
</script>

<div class="w-175">
  <DialogHeading>
    {$t('connectMB.transferHex.heading')}
  </DialogHeading>
  <div class="space-y-5">
    <p bind:this={downloadLinkContainer}>
      <HtmlFormattedMessage
        id="connectMB.transferHex.manualDownload"
        options={{
          values: {
            link: linkWithProps(
              deviceState === DeviceRequestStates.OUTPUT
                ? {
                    download: 'output-program.hex',
                    href:
                      'data:text/plain;charset=utf-8,' +
                      // TODO: Handle when output hex is undefined
                      encodeURIComponent($state.outputHex || ''),
                  }
                : {
                    download: 'machine-learning-tool-program.hex',
                    // Only bluetooth mode has this fallback, the radio bridge mode requires working WebUSB.
                    href: getHexFileUrl('universal', 'bluetooth'),
                  },
            ),
          },
        }} />
    </p>
    <p>
      {$t('connectMB.transferHex.message')}
    </p>
    <img
      class="{imageProps.class} w-full flex-shrink-0"
      alt={$t('connectMB.transferHex.altText')}
      src={imageProps.src} />
    <div class="flex items-center justify-end gap-x-5">
      <StandardButton onClick={onBackClick}>{$t('connectMB.backButton')}</StandardButton>
      {#if onNextClick}
        <StandardButton type="primary" onClick={onNextClick}
          >{$t('connectMB.nextButton')}</StandardButton>
      {/if}
    </div>
  </div>
</div>
