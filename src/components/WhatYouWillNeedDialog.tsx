/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Button, Grid, GridItem, Image, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import batteryPackImage from "../images/stylised-battery-pack.svg";
import microbitImage from "../images/stylised-microbit-black.svg";
import microbitWithBatteryPack from "../images/microbit-with-battery-pack.svg";
import tablet from "../images/tablet-bluetooth.svg";
import twoMicrobitsImage from "../images/stylised-two-microbits-black.svg";
import usbCableImage from "../images/stylised-usb-cable.svg";
import computerImage from "../images/stylised_computer.svg";
import computerBluetoothImage from "../images/stylised_computer_w_bluetooth.svg";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import ExternalLink from "./ExternalLink";
import { useDeployment } from "../deployment";
import { DataConnectionType } from "../data-connection-flow";

const itemsConfig: Record<
  DataConnectionType,
  Array<{
    imgSrc: string;
    titleId: string;
    subtitleId?: string;
    width?: string;
    height?: string;
  }>
> = {
  [DataConnectionType.Radio]: [
    {
      imgSrc: twoMicrobitsImage,
      titleId: "connect-radio-start-requirements1",
      subtitleId: "connect-radio-start-requirements1-subtitle",
    },
    {
      imgSrc: computerImage,
      titleId: "connect-computer",
      subtitleId: "connect-radio-start-requirements2-subtitle",
    },
    {
      imgSrc: usbCableImage,
      titleId: "connect-micro-usb-cable",
    },
    {
      imgSrc: batteryPackImage,
      titleId: "connect-battery-holder",
      subtitleId: "connect-with-batteries",
    },
  ],
  [DataConnectionType.WebBluetooth]: [
    {
      imgSrc: microbitImage,
      titleId: "connect-bluetooth-start-requirements1",
    },
    {
      imgSrc: computerBluetoothImage,
      titleId: "connect-computer",
      subtitleId: "connect-bluetooth-start-requirements2-subtitle",
    },
    {
      imgSrc: usbCableImage,
      titleId: "connect-micro-usb-cable",
    },
    {
      imgSrc: batteryPackImage,
      titleId: "connect-battery-holder",
      subtitleId: "connect-with-batteries",
    },
  ],
  [DataConnectionType.NativeBluetooth]: [
    {
      imgSrc: microbitWithBatteryPack,
      titleId: "connect-native-start-requirements1",
      width: "250px",
      height: "148px",
    },
    {
      imgSrc: tablet,
      titleId: "connect-tablet",
      subtitleId: "connect-with-bluetooth",
      width: "148px",
      height: "148px",
    },
  ],
};

export interface WhatYouWillNeedDialogProps
  extends Omit<
    ConnectContainerDialogProps,
    "children" | "onBack" | "headingId"
  > {
  reconnect: boolean;
  type: DataConnectionType;
  onLinkClick: (() => void) | undefined;
}

const WhatYouWillNeedDialog = ({
  reconnect,
  type,
  onLinkClick,
  ...props
}: WhatYouWillNeedDialogProps) => {
  const { supportLinks } = useDeployment();
  const simpleType: string = {
    [DataConnectionType.NativeBluetooth]: "native",
    [DataConnectionType.Radio]: "radio",
    [DataConnectionType.WebBluetooth]: "bluetooth",
  }[type];
  const otherSimpleType = simpleType === "radio" ? "bluetooth" : "radio";
  return (
    <ConnectContainerDialog
      {...props}
      headingId={
        reconnect
          ? `reconnect-failed-${simpleType}-heading`
          : `connect-${simpleType}-start-heading`
      }
      footerLeft={
        <VStack alignItems="start">
          {onLinkClick && (
            <Button onClick={onLinkClick} variant="link" size="lg">
              <FormattedMessage
                id={`connect-${simpleType}-start-switch-${otherSimpleType}`}
              />
            </Button>
          )}
          {reconnect && (
            <ExternalLink
              href={supportLinks.troubleshooting}
              textId="connect-troubleshoot"
            />
          )}
        </VStack>
      }
    >
      {reconnect && (
        <Text>
          <FormattedMessage id="reconnect-failed-subtitle" />
        </Text>
      )}
      <Grid
        width="100%"
        templateColumns={`repeat(${itemsConfig[type].length}, 1fr)`}
        gap={16}
        p="30px"
      >
        {itemsConfig[type].map(
          ({ imgSrc, width, height, titleId, subtitleId }) => {
            return (
              <GridItem key={titleId}>
                <VStack gap={5}>
                  <Image
                    src={imgSrc}
                    alt=""
                    objectFit="contain"
                    width={width ?? "107px"}
                    height={height ?? "107px"}
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
          }
        )}
      </Grid>
    </ConnectContainerDialog>
  );
};

export default WhatYouWillNeedDialog;
