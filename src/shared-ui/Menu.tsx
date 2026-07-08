/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Capacitor } from "@capacitor/core";
import { ReactNode, useCallback, useState } from "react";
import {
  Menu as RACMenu,
  MenuItem as RACMenuItem,
  MenuItemProps as RACMenuItemProps,
  MenuTrigger as RACMenuTrigger,
  Popover,
  PopoverProps,
  Separator,
} from "react-aria-components";
import { css, cx } from "styled-system/css";
import { menu } from "styled-system/recipes";
import { SystemStyleObject } from "styled-system/types";
import { setActiveMenuClose } from "../back-button";

const isNative = Capacitor.isNativePlatform();

export interface MenuTriggerProps {
  /** Called when the menu opens. */
  onOpen?: () => void;
  /** Called when the menu closes. */
  onClose?: () => void;
  /** The trigger element followed by a `MenuList` (react-aria pattern). */
  children: ReactNode;
}

/**
 * MenuTrigger — react-aria-components' <MenuTrigger>. Its first child is the
 * trigger (e.g. a Button); the second is a `MenuList`. RAC returns focus to the
 * trigger when the menu closes.
 *
 * On native platforms it runs controlled so the Android back button can close
 * the menu via the {@link setActiveMenuClose} registry (only one menu is open at
 * a time). On desktop browsers it's an uncontrolled pass-through.
 */
export const MenuTrigger = ({
  onOpen,
  onClose,
  children,
}: MenuTriggerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (open) {
        setActiveMenuClose(() => {
          setIsOpen(false);
          setActiveMenuClose(null);
        });
        onOpen?.();
      } else {
        setActiveMenuClose(null);
        onClose?.();
      }
    },
    [onOpen, onClose]
  );

  if (!isNative) {
    return (
      <RACMenuTrigger
        onOpenChange={(open) => (open ? onOpen?.() : onClose?.())}
      >
        {children}
      </RACMenuTrigger>
    );
  }

  return (
    <RACMenuTrigger isOpen={isOpen} onOpenChange={handleOpenChange}>
      {children}
    </RACMenuTrigger>
  );
};

export interface MenuListProps {
  children: ReactNode;
  /** Placement of the dropdown relative to the trigger. */
  placement?: PopoverProps["placement"];
  /** Per-instance style overrides, merged after the recipe. */
  css?: SystemStyleObject;
  className?: string;
}

/**
 * MenuList — the dropdown surface: RAC's <Popover> (positioned card) wrapping a
 * RAC <Menu> (the list). Place `MenuItem`s inside.
 */
export const MenuList = ({
  children,
  // Matches Chakra Menu's default "bottom-start".
  placement = "bottom start",
  css: cssProp,
  className,
}: MenuListProps) => {
  const slots = menu();
  return (
    <Popover
      placement={placement}
      className={cx(
        slots.content,
        cssProp ? css(cssProp) : undefined,
        className
      )}
    >
      <RACMenu className={slots.list}>{children}</RACMenu>
    </Popover>
  );
};

export interface MenuItemProps
  extends Omit<RACMenuItemProps, "className" | "children"> {
  /** Icon rendered before the label, matching Chakra's MenuItem `icon`. */
  icon?: ReactNode;
  /** Per-instance style overrides, merged after the recipe. */
  css?: SystemStyleObject;
  className?: string;
  children?: ReactNode;
}

/**
 * MenuItem — a RAC <MenuItem> styled with the `menu` recipe's `item` slot.
 * Use `onAction` for the click behaviour (RAC closes the menu automatically).
 */
export const MenuItem = ({
  icon,
  css: cssProp,
  className,
  children,
  ...rest
}: MenuItemProps) => {
  const slots = menu();
  return (
    <RACMenuItem
      className={cx(slots.item, cssProp ? css(cssProp) : undefined, className)}
      {...rest}
    >
      {icon ? (
        <>
          <span className={slots.icon}>{icon}</span>
          <span className={slots.label}>{children}</span>
        </>
      ) : (
        children
      )}
    </RACMenuItem>
  );
};

export interface MenuDividerProps {
  css?: SystemStyleObject;
  className?: string;
}

/** Horizontal rule separating groups of menu items. */
export const MenuDivider = ({ css: cssProp, className }: MenuDividerProps) => {
  const slots = menu();
  return (
    <Separator
      className={cx(
        slots.divider,
        cssProp ? css(cssProp) : undefined,
        className
      )}
    />
  );
};
