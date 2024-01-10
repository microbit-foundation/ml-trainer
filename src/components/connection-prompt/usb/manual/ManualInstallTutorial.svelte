<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../../../../i18n';
  import { onMount } from 'svelte';
  import StandardButton from '../../../StandardButton.svelte';
  import Microbits from '../../../../script/microbit-interfacing/Microbits';
  import Bowser from 'bowser';
  import transferFirmwareMacOSImage from '../../../../imgs/transfer_firmware_macos.gif';
  import transferFirmwareChromeOSImage from '../../../../imgs/transfer_firmware_chromeos.gif';
  import transferFirmwareWindowsImage from '../../../../imgs/transfer_firmware_windows.gif';
  import DialogHeading from '../../../DialogHeading.svelte';
  import EscapedChunksFormattedMessage, {
    linkWithProps,
  } from '../../../HtmlFormattedMessage.svelte';
  import HtmlFormattedMessage from '../../../HtmlFormattedMessage.svelte';

  export let onConnectBluetoothClick: () => void;

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
    switch (os) {
      case 'Chrome OS':
        return { src: transferFirmwareChromeOSImage, class: 'w-290px h-133px' };
      case 'Windows':
        return { src: transferFirmwareWindowsImage, class: 'w-290px h-146px' };
      case 'macOS':
        return { src: transferFirmwareMacOSImage, class: 'w-290px h-104px' };
      default:
        return { src: transferFirmwareMacOSImage, class: 'w-290px h-104px' };
    }
  };

  const imageProps = getImageProps(osName);
</script>

<main>
  <div class="w-175">
    <DialogHeading>
      {$t('connectMB.usb.manual.header')}
    </DialogHeading>
    <div class="space-y-5">
      <p bind:this={downloadLinkContainer}>
        <HtmlFormattedMessage
          id="connectMB.usb.manual.manualDownload"
          options={{
            values: {
              link: linkWithProps({
                download: 'machine-learning-tool-program.hex',
                href: Microbits.hexFiles.universal,
              }),
            },
          }} />
      </p>
      <div class="flex align-top gap-5">
        <ol class="w-auto">
          <li>1. {$t('connectMB.USBCompatibility.transferStep.step1')}</li>
          <li>2. {$t('connectMB.USBCompatibility.transferStep.step2')}</li>
          <li>3. {$t('connectMB.USBCompatibility.transferStep.step3')}</li>
        </ol>
        <img
          class="{imageProps.class} flex-shrink-0"
          alt={$t('connectMB.USBCompatibility.transferStep.altText')}
          src={imageProps.src} />
      </div>
    </div>
    <div class="flex justify-center pt-5">
      <StandardButton type="primary" onClick={onConnectBluetoothClick}
        >{$t('connectMB.usb.manual.done')}</StandardButton>
    </div>
  </div>
</main>
