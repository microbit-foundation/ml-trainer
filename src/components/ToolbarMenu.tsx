import {
  Box,
  BoxProps,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  ThemeTypings,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { RiMenuLine } from "react-icons/ri";

interface ToolbarMenuProps extends BoxProps {
  label: string;
  children: ReactNode;
  icon?: JSX.Element;
  variant?: ThemeTypings["components"]["Menu"]["variants"];
  onDarkBackground?: boolean;
}

const ToolbarMenu = ({
  label,
  icon,
  children,
  variant,
  onDarkBackground = true,
  ...props
}: ToolbarMenuProps) => {
  return (
    <Box {...props}>
      <Menu>
        <MenuButton
          as={IconButton}
          aria-label={label}
          icon={icon ?? <RiMenuLine size={24} color="white" />}
          variant={variant}
          size="lg"
          fontSize="xl"
          _focusVisible={{
            boxShadow: onDarkBackground ? "outlineDark" : "outline",
          }}
        />
        <MenuList zIndex={2}>{children}</MenuList>
      </Menu>
    </Box>
  );
};

export default ToolbarMenu;
