/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, css, Flex, Image, List, ListItem, Text } from "../shared-ui";
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
    <ConnectContainerDialog
      headingId="connect-popup-bluetooth-title"
      {...props}
    >
      <Box position="relative" width={"100%"} alignSelf={""}>
        <Image
          height={379}
          width={350}
          src={selectMicrobitImage}
          alt={intl.formatMessage({
            id: "connect-popup-bluetooth-alt",
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
          <FormattedMessage id="connect-popup-instruction-heading" />
        </Text>
        <List
          position="absolute"
          left="500px"
          top="61px"
          display="flex"
          flexDirection="column"
          alignItems="flex-start"
          gap={2}
        >
          <ListItem>
            <Flex alignItems="center" height="90px">
              <span className={css({ srOnly: true })}>
                <Text>1. </Text>
              </span>
              <Text>
                <FormattedMessage id="connect-popup-instruction1" />
              </Text>
            </Flex>
          </ListItem>
          <ListItem>
            <Flex alignItems="center" height="57px">
              <span className={css({ srOnly: true })}>
                <Text>2. </Text>
              </span>
              <Text>
                <FormattedMessage id="connect-popup-bluetooth-instruction2" />
              </Text>
            </Flex>
          </ListItem>
        </List>
        <Box position="absolute" top="86px" left="240px">
          <ArrowOne />
        </Box>
        <Box position="absolute" bottom="42px" left="268px">
          <ArrowTwo />
        </Box>
      </Box>
    </ConnectContainerDialog>
  );
};

export default SelectMicrobitBluetoothDialog;
