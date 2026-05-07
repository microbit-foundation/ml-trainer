/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Capacitor } from "@capacitor/core";
import { Menu as ChakraMenu, MenuProps } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { setActiveMenuClose } from "../back-button";

const isNative = Capacitor.isNativePlatform();

/**
 * Wrapper around Chakra UI Menu that integrates with native back button
 * handling. On Android, opening the menu registers a close callback so
 * that the Anrdoid back button dismisses the menu.
 *
 * On native platforms the menu runs in controlled mode so the back button
 * handler can close it.
 *
 * On desktop browsers this is a plain pass-through to Chakra Menu.
 */
const Menu = ({ onOpen, onClose, ...props }: MenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setActiveMenuClose(() => {
      setIsOpen(false);
      setActiveMenuClose(null);
    });
    onOpen?.();
  }, [onOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setActiveMenuClose(null);
    onClose?.();
  }, [onClose]);

  if (!isNative) {
    return <ChakraMenu onOpen={onOpen} onClose={onClose} {...props} />;
  }

  return (
    <ChakraMenu
      isOpen={isOpen}
      onOpen={handleOpen}
      onClose={handleClose}
      {...props}
    />
  );
};

export default Menu;
