/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { AspectRatio, Image, Link, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import tripleReset from "../images/bluetooth-mode-triple-reset.gif";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";

export interface ResetToBluetoothModeDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {}

const ResetToBluetoothModeDialog = ({
  ...props
}: ResetToBluetoothModeDialogProps) => {
  return (
    <ConnectContainerDialog
      {...props}
      headingId="reset-to-bluetooth-mode-heading"
      footerLeft={
        <Link
          color="brand.600"
          // TODO: implement
          href=""
          target="_blank"
          rel="noopener"
          display="flex"
          flexDirection="row"
          gap={1}
        >
          <FormattedMessage id="connect-try-another-way" />
        </Link>
      }
    >
      <VStack gap={5} width="100%">
        <Text alignSelf="left" width="100%">
          <FormattedMessage id="reset-to-bluetooth-mode-subtitle" />
        </Text>
        <AspectRatio
          ratio={3 / 2}
          bgColor="blackAlpha.300"
          width="22rem"
          rounded="md"
        >
          <Image src={tripleReset} alt="" mt={-2.5} px={5} />
        </AspectRatio>
      </VStack>
    </ConnectContainerDialog>
  );
};

export default ResetToBluetoothModeDialog;
