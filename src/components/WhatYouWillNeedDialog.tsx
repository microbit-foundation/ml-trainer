import { Grid, GridItem, Image, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import batteryPackImage from "../images/stylised-battery-pack.svg";
import microbitImage from "../images/stylised-microbit-black.svg";
import twoMicrobitsImage from "../images/stylised-two-microbits-black.svg";
import usbCableImage from "../images/stylised-usb-cable.svg";
import computerImage from "../images/stylised_computer.svg";
import computerBluetoothImage from "../images/stylised_computer_w_bluetooth.svg";
import { ConnectionType } from "../connection-flow";

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

export interface WhatYouWillNeedDialogProps
  extends Omit<
    ConnectContainerDialogProps,
    "children" | "onBack" | "headingId"
  > {
  reconnect: boolean;
  type: ConnectionType;
}

const WhatYouWillNeedDialog = ({
  reconnect,
  type,
  ...props
}: WhatYouWillNeedDialogProps) => {
  const configs = {
    [ConnectionType.Bluetooth]: whatYouWillNeedBluetoothConfig,
    [ConnectionType.RadioRemote]: whatYouWillNeedRadioConfig,
    [ConnectionType.RadioBridge]: whatYouWillNeedRadioConfig,
  };
  const { items, headingId, reconnectHeadingId } = configs[type];
  return (
    <ConnectContainerDialog
      {...props}
      headingId={reconnect ? reconnectHeadingId : headingId}
    >
      {reconnect && (
        <Text>
          <FormattedMessage id="reconnectFailed.subtitle" />
        </Text>
      )}
      <Grid
        width="100%"
        templateColumns={`repeat(${items.length}, 1fr)`}
        gap={16}
        py="50px"
      >
        {items.map(({ imgSrc, titleId, subtitleId }) => {
          return (
            <GridItem key={titleId}>
              <VStack gap={5}>
                <Image
                  src={imgSrc}
                  alt=""
                  objectFit="contain"
                  boxSize="107px"
                />
                <VStack textAlign="center">
                  <Text fontWeight="bold">
                    <FormattedMessage id={titleId} />
                  </Text>
                  {subtitleId && (
                    <Text>
                      <FormattedMessage id={subtitleId} />
                    </Text>
                  )}
                </VStack>
              </VStack>
            </GridItem>
          );
        })}
      </Grid>
    </ConnectContainerDialog>
  );
};

export default WhatYouWillNeedDialog;
