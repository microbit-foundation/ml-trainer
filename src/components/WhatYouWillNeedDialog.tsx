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
import { useDeployment } from "../deployment";

const itemsConfig = {
  radio: [
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
  bluetooth: [
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
  const { supportLinks } = useDeployment();
  return (
    <ConnectContainerDialog
      {...props}
      headingId={
        reconnect
          ? `reconnect-failed-${type}-heading`
          : `connect-${type}-start-heading`
      }
      footerLeft={
        <VStack alignItems="start">
          {onLinkClick && (
            <Button onClick={onLinkClick} variant="link" size="lg">
              <FormattedMessage
                id={`connect-${type}-start-switch-${
                  type === "bluetooth" ? "radio" : "bluetooth"
                }`}
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
