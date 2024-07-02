import { WhatYouWillNeedDialogProps } from "./components/WhatYouWillNeedDialog";
import { ConnectionType } from "./connection-flow";
import batteryPackImage from "./images/stylised-battery-pack.svg";
import microbitImage from "./images/stylised-microbit-black.svg";
import twoMicrobitsImage from "./images/stylised-two-microbits-black.svg";
import usbCableImage from "./images/stylised-usb-cable.svg";
import computerImage from "./images/stylised_computer.svg";
import computerBluetoothImage from "./images/stylised_computer_w_bluetooth.svg";

const whatYouWillNeedRadioConfig = {
  headingId: "connectMB.radioStart.heading",
  reconnectHeadingId: "reconnectFailed.radioHeading",
  linkTextId: "connectMB.radioStart.switchBluetooth",
  items: [
    {
      imgSrc: twoMicrobitsImage,
      titleId: "connectMB.radioStart.requirements1",
    },
    {
      imgSrc: computerImage,
      titleId: "connectMB.radioStart.requirements2",
      subtitleId: "connectMB.radioStart.requirements2.subtitle",
    },
    {
      imgSrc: usbCableImage,
      titleId: "connectMB.radioStart.requirements3",
    },
    {
      imgSrc: batteryPackImage,
      titleId: "connectMB.radioStart.requirements4",
      subtitleId: "connectMB.radioStart.requirements4.subtitle",
    },
  ],
};

const whatYouWillNeedBluetoothConfig = {
  headingId: "connectMB.bluetoothStart.heading",
  reconnectHeadingId: "reconnectFailed.bluetoothHeading",
  linkTextId: "connectMB.bluetoothStart.switchRadio",
  items: [
    {
      imgSrc: microbitImage,
      titleId: "connectMB.bluetoothStart.requirements1",
    },
    {
      imgSrc: computerBluetoothImage,
      titleId: "connectMB.bluetoothStart.requirements2",
      subtitleId: "connectMB.bluetoothStart.requirements2.subtitle",
    },
    {
      imgSrc: usbCableImage,
      titleId: "connectMB.bluetoothStart.requirements3",
    },
    {
      imgSrc: batteryPackImage,
      titleId: "connectMB.bluetoothStart.requirements4",
      subtitleId: "connectMB.bluetoothStart.requirements4.subtitle",
    },
  ],
};

export const whatYouWillNeedConfig: Record<
  ConnectionType,
  Pick<
    WhatYouWillNeedDialogProps,
    "headingId" | "reconnectHeadingId" | "items" | "linkTextId"
  >
> = {
  [ConnectionType.Bluetooth]: whatYouWillNeedBluetoothConfig,
  [ConnectionType.RadioRemote]: whatYouWillNeedRadioConfig,
  [ConnectionType.RadioBridge]: whatYouWillNeedRadioConfig,
};
