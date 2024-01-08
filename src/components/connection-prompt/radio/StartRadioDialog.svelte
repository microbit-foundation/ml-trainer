<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import microbitImage from '../../../imgs/stylised-two-microbits-black.svg';
  import computerImage from '../../../imgs/stylised_computer.svg';
  import usbCableImage from '../../../imgs/stylised-usb-cable.svg';
  import batteryPackImage from '../../../imgs/stylised-battery-pack.svg';
  import WhatYouWillNeedDialog from '../../WhatYouWillNeedDialog.svelte';

  export let onNextClick: () => void;
  export let onStartBluetoothClick: () => void;

  const items = [
    {
      imgSrc: microbitImage,
      titleId: 'connectMB.radioStart.requirements1',
    },
    {
      imgSrc: computerImage,
      titleId: 'connectMB.radioStart.requirements2',
      subtitleId: 'connectMB.radioStart.requirements2.subtitle',
    },
    {
      imgSrc: usbCableImage,
      titleId: 'connectMB.radioStart.requirements3',
    },
    {
      imgSrc: batteryPackImage,
      titleId: 'connectMB.radioStart.requirements4',
      subtitleId: 'connectMB.radioStart.requirements4.subtitle',
    },
  ];
</script>

<WhatYouWillNeedDialog
  {items}
  headingId="connectMB.radioStart.heading"
  switchTextId="connectMB.radioStart.switchBluetooth"
  onSwitchClick={onStartBluetoothClick}
  {onNextClick} />
