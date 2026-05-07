/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { BoxProps, Text, VStack } from "@chakra-ui/react";
import { BrandConfigFactory } from "..";
import theme from "./theme";

const defaultBrandFactory: BrandConfigFactory = () => ({
  chakraTheme: theme,
  appNameFull: "ml-trainer",
  appNameShort: "ml-trainer",
  product: "ml-trainer",
  AppLogo: (props: BoxProps) => {
    return (
      <VStack
        color="white"
        fontWeight="bold"
        justifyContent="center"
        alignItems="center"
        {...props}
      >
        <Text>ml-trainer</Text>
      </VStack>
    );
  },
  OrgLogo: undefined,
  supportLinks: {
    // Just placeholders, these need replacing in a real deployment with branded help content.
    bluetooth: "https://support.microbit.org",
    main: "https://support.microbit.org",
    troubleshooting: "https://support.microbit.org",
    wearable: "https://support.microbit.org",
  },
});

export default defaultBrandFactory;
