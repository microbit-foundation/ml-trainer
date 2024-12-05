/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { theme } from "@chakra-ui/react";
import { StyleConfig, StyleFunctionProps } from "@chakra-ui/theme-tools";

const Alert: StyleConfig = {
  variants: {
    // TODO: reconsider this theme customisation
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    toast: (props: StyleFunctionProps) => {
      const base = {
        ...theme.components.Alert.variants!.solid(props),
      };
      return {
        ...base,
        container: {
          ...base.container,
          bg:
            props.status === "success" || props.status === "info"
              ? "teal.800"
              : "red.600",
        },
      };
    },
  },
};

export default Alert;
