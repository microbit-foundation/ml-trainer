<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import microbitImage from '../../../imgs/stylised-microbit-black.svg';
  import computerImage from '../../../imgs/stylised_computer.svg';
  import usbCableImage from '../../../imgs/stylised-usb-cable.svg';
  import batteryPackImage from '../../../imgs/stylised-battery-pack.svg';
  import WhatYouWillNeedDialog from '../WhatYouWillNeedDialog.svelte';
  import { get } from 'svelte/store';
  import { compatibility, state } from '../../../script/stores/uiStore';

  export let onNextClick: () => void;
  export let onStartRadioClick: (() => void) | undefined;

  const items = [
    {
      imgSrc: microbitImage,
      titleId: 'connectMB.bluetoothStart.requirements1',
    },
    {
      imgSrc: computerImage,
      titleId: 'connectMB.bluetoothStart.requirements2',
      subtitleId: 'connectMB.bluetoothStart.requirements2.subtitle',
    },
    {
      imgSrc: usbCableImage,
      titleId: 'connectMB.bluetoothStart.requirements3',
    },
    {
      imgSrc: batteryPackImage,
      titleId: 'connectMB.bluetoothStart.requirements4',
      subtitleId: 'connectMB.bluetoothStart.requirements4.subtitle',
    },
  ];

  const { usb } = get(compatibility);
</script>

<WhatYouWillNeedDialog
  {items}
  headingId={$state.reconnectState.reconnectFailed
    ? 'reconnectFailed.bluetoothHeading'
    : usb
      ? 'connectMB.bluetoothStart.heading'
      : 'connectMB.radioStart.heading'}
  switchTextId="connectMB.bluetoothStart.switchRadio"
  onSwitchClick={onStartRadioClick}
  {onNextClick} />
