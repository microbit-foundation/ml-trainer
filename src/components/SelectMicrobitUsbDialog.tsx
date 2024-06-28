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

export interface SelectMicrobitDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {}

const SelectMicrobitUsbDialog = ({ ...props }: SelectMicrobitDialogProps) => {
  const intl = useIntl();

  return (
    <ConnectContainerDialog headingId="connectMB.webPopup" {...props}>
      <Box position="relative" width={"100%"} alignSelf={""}>
        <Image
          height={375}
          width={418}
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
          <FormattedMessage id="connectMB.webPopup.instruction.heading" />
        </Text>
        <List
          position="absolute"
          left="490px"
          top="61px"
          alignItems="flex-start"
          spacing={2}
        >
          <ListItem>
            <Flex alignItems="center" height="72px">
              <VisuallyHidden>
                <Text>1. </Text>
              </VisuallyHidden>
              <Text>
                <FormattedMessage id="connectMB.webPopup.instruction1" />
              </Text>
            </Flex>
          </ListItem>
          <ListItem>
            <Flex alignItems="center" height="72px">
              <VisuallyHidden>
                <Text>2. </Text>
              </VisuallyHidden>
              <Text>
                <FormattedMessage id="connectMB.webPopup.webUsb.instruction2" />
              </Text>
            </Flex>
          </ListItem>
        </List>
        <Box position="absolute" top="81px" left="230px">
          <ArrowOne />
        </Box>
        <Box position="absolute" bottom="48px" left="256px">
          <ArrowTwo />
        </Box>
      </Box>
    </ConnectContainerDialog>
  );
};

export default SelectMicrobitUsbDialog;
