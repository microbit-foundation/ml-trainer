import {
  Box,
  Flex,
  Image,
  List,
  ListItem,
  Text,
  VisuallyHidden,
} from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import selectMicrobitImage from "../images/select-microbit-web-usb.png";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import ArrowOne from "./ArrowOne";
import ArrowTwo from "./ArrowTwo";
import { ConnectionFlowType } from "../connection-stage-hooks";

export interface SelectMicrobitDialogProps
  extends Omit<ConnectContainerDialogProps, "children"> {}

export const getHeadingId = (flowType: ConnectionFlowType) => {
  switch (flowType) {
    case ConnectionFlowType.ConnectBluetooth:
      return "connect-popup-usb-bluetooth-data-collection-title";
    case ConnectionFlowType.ConnectRadioRemote:
      return "connect-popup-usb-radio-data-collection-title";
    case ConnectionFlowType.ConnectRadioBridge:
      return "connect-popup-usb-radio-link-title";
  }
};

const SelectMicrobitUsbDialog = ({ ...props }: SelectMicrobitDialogProps) => {
  const intl = useIntl();

  return (
    <ConnectContainerDialog {...props}>
      <Box position="relative" width="100%">
        <Image
          height={375}
          width={342}
          src={selectMicrobitImage}
          alt={intl.formatMessage({ id: "connect-help-alt" })}
        />
        <Text
          position="absolute"
          as="h3"
          fontWeight="semibold"
          left="442px"
          top="0px"
          fontSize="xl"
        >
          <FormattedMessage id="connect-popup-instruction-heading" />
        </Text>
        <List
          position="absolute"
          left="490px"
          top="68px"
          alignItems="flex-start"
          spacing={2}
        >
          <ListItem>
            <Flex alignItems="center" height="72px">
              <VisuallyHidden>
                <Text>1. </Text>
              </VisuallyHidden>
              <Text>
                <FormattedMessage id="connect-popup-instruction1" />
              </Text>
            </Flex>
          </ListItem>
          <ListItem>
            <Flex alignItems="center" height="72px">
              <VisuallyHidden>
                <Text>2. </Text>
              </VisuallyHidden>
              <Text>
                <FormattedMessage id="connect-popup-webusb-instruction2" />
              </Text>
            </Flex>
          </ListItem>
        </List>
        <Box position="absolute" top="85px" left="230px">
          <ArrowOne />
        </Box>
        <Box position="absolute" bottom="43px" left="259px">
          <ArrowTwo />
        </Box>
      </Box>
    </ConnectContainerDialog>
  );
};

export default SelectMicrobitUsbDialog;
