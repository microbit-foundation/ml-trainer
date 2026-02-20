/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Box,
  BoxProps,
  IconButton,
  MenuButton,
  MenuList,
  ThemeTypings,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { RiMenuLine } from "react-icons/ri";
import Menu from "./Menu";

interface ToolbarMenuProps extends BoxProps {
  label: string;
  children: ReactNode;
  icon?: JSX.Element;
  variant?: ThemeTypings["components"]["Menu"]["variants"];
}

const ToolbarMenu = ({
  label,
  icon,
  children,
  variant,
  ...props
}: ToolbarMenuProps) => {
  return (
    <Box {...props}>
      <Menu>
        <MenuButton
          as={IconButton}
          aria-label={label}
          color="white"
          icon={icon ?? <RiMenuLine size={24} />}
          variant={variant}
          size="lg"
          fontSize="xl"
          _focusVisible={{
            boxShadow: "outlineDark",
          }}
        />
        <MenuList zIndex={2}>{children}</MenuList>
      </Menu>
    </Box>
  );
};

export default ToolbarMenu;
