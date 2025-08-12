/**
 * (c) 2025, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box } from "@chakra-ui/react";
import { useIntl } from "react-intl";

const ChooseDeviceOverlay = () => {
  const intl = useIntl();
  return (
    <Box
      // We don't really expect it to be possible to interact with this overlay
      // as it is only shown when the native browser requestDeviceDialog is
      // open. But still useful for code trying to identify open dialogs.
      role="dialog"
      aria-label={intl.formatMessage({ id: "connect-popup-instruction1" })}
      width="100vw"
      height="100vh"
      background="blackAlpha.600"
      position="fixed"
      top={0}
      left={0}
      zIndex="overlay"
    />
  );
};

export default ChooseDeviceOverlay;
