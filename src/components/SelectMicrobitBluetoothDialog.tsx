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
import selectMicrobitImage from "../images/select-microbit-bluetooth.png";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import ArrowOne from "./ArrowOne";
import ArrowTwo from "./ArrowTwo";

export interface SelectMicrobitBluetoothDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {}

const SelectMicrobitBluetoothDialog = ({
  ...props
}: SelectMicrobitBluetoothDialogProps) => {
  const intl = useIntl();

  return (
    <ConnectContainerDialog headingId="connectMB.webPopup" {...props}>
      <Box position="relative" width={"100%"} alignSelf={""}>
        <Image
          height={365}
          width={418}
          src={selectMicrobitImage}
          alt={intl.formatMessage({
            id: "connectMB.webPopup.webBluetooth.altText",
          })}
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
          left="500px"
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
            <Flex alignItems="center" height="50px">
              <VisuallyHidden>
                <Text>2. </Text>
              </VisuallyHidden>
              <Text>
                <FormattedMessage id="connectMB.webPopup.webBluetooth.instruction2" />
              </Text>
            </Flex>
          </ListItem>
        </List>
        <Box position="absolute" top="81px" left="240px">
          <ArrowOne />
        </Box>
        <Box position="absolute" bottom="48px" left="265px">
          <ArrowTwo />
        </Box>
      </Box>
    </ConnectContainerDialog>
  );
};

export default SelectMicrobitBluetoothDialog;