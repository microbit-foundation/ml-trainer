import { theme, StyleFunctionProps } from "@chakra-ui/react";
import { StyleConfig } from "@chakra-ui/theme-tools";

const Button: StyleConfig = {
  baseStyle: {
    borderRadius: "button",
  },
  variants: {
    unstyled: {
      borderRadius: "unset",
    },
    zoom: (props: StyleFunctionProps) => {
      const base = {
        ...theme.components.Button.variants!.solid(props),
      };
      return {
        ...base,
        _hover: {
          ...base._hover,
          backgroundColor: "gray.400",
        },
        _active: {
          ...base._active,
          backgroundColor: "gray.500",
        },
      };
    },
    secondary: () => ({
      borderWidth: "2px",
      borderColor: "black",
      color: "black",
      bg: "transparent",
      _hover: {
        bg: "blackAlpha.50",
      },
      _active: {
        bg: "blackAlpha.100",
      },
    }),
    ghost: () => ({
      color: "black",
      bg: "transparent",
      _hover: {
        bg: "blackAlpha.50",
      },
      _active: {
        bg: "blackAlpha.100",
      },
    }),
    primary: () => ({
      color: "white",
      bg: "black",
      _hover: {
        bg: "blackAlpha.800",
        _disabled: {
          bg: "black",
        },
      },
      _active: {
        bg: "blackAlpha.700",
      },
    }),
    toolbar: () => ({
      color: "black",
      bg: "white",
      _hover: {
        bg: "whiteAlpha.900",
        _disabled: {
          bg: "white",
        },
      },
      _active: {
        bg: "whiteAlpha.800",
      },
      _focusVisible: {
        boxShadow: "outlineDark",
      },
    }),
    sidebar: (props: StyleFunctionProps) => {
      const base = {
        ...theme.components.Button.variants!.ghost(props),
      };
      return {
        ...base,
        _hover: {
          ...base._hover,
          bg: "white",
          color: "gray.700",
          _disabled: {
            bg: base.bg,
          },
        },
        _active: {
          ...base._hover,
          bg: "white",
          color: "gray.800",
        },
      };
    },
    language: () => ({
      borderWidth: "2px",
      borderColor: "gray.200",
      color: "green.500",
      _hover: {
        color: "green.600",
        bg: "gray.100",
      },
    }),
  },
};

export default Button;
