<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../../../../i18n';
  import { onMount } from 'svelte';
  import StandardButton from '../../../StandardButton.svelte';
  import Microbits from '../../../../script/microbit-interfacing/Microbits';
  import ImageSkeleton from '../../../skeletonloading/ImageSkeleton.svelte';
  import Bowser from 'bowser';
  import transferFirmwareMacOSImage from '../../../../imgs/transfer_firmware_macos.gif';
  import transferFirmwareChromeOSImage from '../../../../imgs/transfer_firmware_chromeos.gif';
  import transferFirmwareWindowsImage from '../../../../imgs/transfer_firmware_windows.gif';
  import DialogHeading from '../../../DialogHeading.svelte';

  export let onConnectBluetoothClick: () => void;

  onMount(() => Microbits.downloadFirmware());

  const browser = Bowser.getParser(window.navigator.userAgent);
  const osName = browser.getOS().name ?? 'unknown';

  // See https://github.com/lancedikson/bowser/blob/master/src/constants.js
  const getIllustrationGif = (os: string) => {
    switch (os) {
      case 'Chrome OS':
        return transferFirmwareChromeOSImage;
      case 'Windows':
        return transferFirmwareWindowsImage;
      case 'macOS':
        return transferFirmwareMacOSImage;
      default:
        return transferFirmwareMacOSImage;
    }
  };

  const transferIllustration = getIllustrationGif(osName);
</script>

<main>
  <div class="w-175">
    <DialogHeading>
      {$t('connectMB.usb.manual.header')}
    </DialogHeading>
    <div class="space-y-5">
      <p>
        {$t('connectMB.usb.manual.manualDownload')}
        <span>
          <button
            class="hover:cursor-pointer text-red-500 underline"
            on:click={() => Microbits.downloadFirmware()}
            >{$t('connectMB.usb.manual.manualDownloadLink')}</button>
        </span>
      </p>
      <div class="flex gap-5">
        <ol class="w-auto">
          <li>1. {$t('connectMB.USBCompatibility.transferStep.step1')}</li>
          <li>2. {$t('connectMB.USBCompatibility.transferStep.step2')}</li>
          <li>3. {$t('connectMB.USBCompatibility.transferStep.step3')}</li>
        </ol>
        <img
          class="w-290px h-168px flex-shrink-0"
          alt="Transferring the firmware"
          src={transferIllustration} />
      </div>
    </div>
    <div class="flex justify-center pt-5">
      <StandardButton type="primary" onClick={onConnectBluetoothClick}
        >{$t('connectMB.usb.manual.done')}</StandardButton>
    </div>
  </div>
</main>
