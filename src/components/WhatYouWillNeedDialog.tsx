import { Button, Grid, GridItem, Image, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import batteryPackImage from "../images/stylised-battery-pack.svg";
import microbitImage from "../images/stylised-microbit-black.svg";
import twoMicrobitsImage from "../images/stylised-two-microbits-black.svg";
import usbCableImage from "../images/stylised-usb-cable.svg";
import computerImage from "../images/stylised_computer.svg";
import computerBluetoothImage from "../images/stylised_computer_w_bluetooth.svg";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import ExternalLink from "./ExternalLink";

const itemsConfig = {
  radio: [
    {
      imgSrc: twoMicrobitsImage,
      titleId: "connectMB.radioStart.requirements1",
      subtitleId: "connectMB.radioStart.requirements1.subtitle",
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
  bluetooth: [
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
  type: "radio" | "bluetooth";
  onLinkClick: (() => void) | undefined;
}

const WhatYouWillNeedDialog = ({
  reconnect,
  type,
  onLinkClick,
  ...props
}: WhatYouWillNeedDialogProps) => {
  return (
    <ConnectContainerDialog
      {...props}
      headingId={
        reconnect
          ? `reconnectFailed.${type}Heading`
          : `connectMB.${type}Start.heading`
      }
      footerLeft={
        <VStack alignItems="start">
          {onLinkClick && (
            <Button onClick={onLinkClick} variant="link" size="lg">
              <FormattedMessage
                id={`connectMB.${type}Start.switch${
                  type === "bluetooth" ? "Radio" : "Bluetooth"
                }`}
              />
            </Button>
          )}
          {reconnect && (
            <ExternalLink
              href="https://support.microbit.org/a/solutions/articles/19000157495"
              textId="connectMB.troubleshoot"
            />
          )}
        </VStack>
      }
    >
      {reconnect && (
        <Text>
          <FormattedMessage id="reconnectFailed.subtitle" />
        </Text>
      )}
      <Grid
        width="100%"
        templateColumns={`repeat(${itemsConfig[type].length}, 1fr)`}
        gap={16}
        py="30px"
      >
        {itemsConfig[type].map(({ imgSrc, titleId, subtitleId }) => {
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
