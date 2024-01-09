<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import microbitImage from '../../../imgs/stylised-microbit-black.svg';
  import computerImage from '../../../imgs/stylised_computer.svg';
  import usbCableImage from '../../../imgs/stylised-usb-cable.svg';
  import batteryPackImage from '../../../imgs/stylised-battery-pack.svg';
  import WhatYouWillNeedDialog from '../../WhatYouWillNeedDialog.svelte';

  export let onNextClick: () => void;
  export let onStartRadioClick: () => void;

  const items = [
    {
      imgSrc: microbitImage,
      imgAltId: 'connectMB.bluetoothStart.requirements1',
      titleId: 'connectMB.bluetoothStart.requirements1',
    },
    {
      imgSrc: computerImage,
      imgAltId: 'connectMB.bluetoothStart.requirements2',
      titleId: 'connectMB.bluetoothStart.requirements2',
      subtitleId: 'connectMB.bluetoothStart.requirements2.subtitle',
    },
    {
      imgSrc: usbCableImage,
      imgAltId: 'connectMB.bluetoothStart.requirements3',
      titleId: 'connectMB.bluetoothStart.requirements3',
    },
    {
      imgSrc: batteryPackImage,
      imgAltId: 'connectMB.bluetoothStart.requirements4',
      titleId: 'connectMB.bluetoothStart.requirements4',
      subtitleId: 'connectMB.bluetoothStart.requirements4.subtitle',
    },
  ];
</script>

<WhatYouWillNeedDialog
  {items}
  headingId="connectMB.bluetoothStart.heading"
  subtitleId="connectMB.bluetoothStart.subtitle"
  switchTextId="connectMB.bluetoothStart.switchRadio"
  onSwitchClick={onStartRadioClick}
  {onNextClick} />
