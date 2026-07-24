/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { memo, useCallback } from "react";
import {
  Button as RACButton,
  Dialog,
  DialogTrigger,
  OverlayArrow,
  Popover,
} from "react-aria-components";
import { RiArrowDropDownFill } from "react-icons/ri";
import { useIntl } from "react-intl";
import { button } from "styled-system/recipes";
import { css, cx, Grid, IconButton } from "@microbit/ui";
import { MakeCodeIcon, makecodeIcons } from "../utils/icons";
import LedIconSvg from "./icons/LedIconSvg";

interface LedIconPicker {
  actionName: string;
  onIconSelected: (icon: MakeCodeIcon) => void;
  children: React.ReactElement;
  autoFocus?: boolean;
}

const LedIconPicker = ({
  actionName,
  onIconSelected,
  children,
  autoFocus = false,
}: LedIconPicker) => {
  const intl = useIntl();
  const handleClick = useCallback(
    (icon: MakeCodeIcon, callback: () => void) => {
      onIconSelected(icon);
      callback();
    },
    [onIconSelected]
  );

  return (
    <DialogTrigger>
      <RACButton
        autoFocus={autoFocus}
        aria-label={
          actionName
            ? intl.formatMessage(
                { id: "select-icon-action-aria" },
                { action: actionName }
              )
            : intl.formatMessage({
                id: "select-icon-action-untitled-aria",
              })
        }
        className={css({
          display: "flex",
          alignItems: "center",
          gap: 2,
          bg: "transparent",
          border: "none",
          borderRadius: "2px",
          cursor: "pointer",
          outline: "none",
          _focusVisible: { focusShadow: "outline" },
        })}
      >
        {children}
        {/* Decorative ghost-button look (Chakra had IconButton as="div"). */}
        <span
          className={cx(
            button({ variant: "ghost", size: "sm" }),
            css({
              px: 0,
              color: "blackAlpha.700",
            })
          )}
          aria-hidden
        >
          <RiArrowDropDownFill size={32} />
        </span>
      </RACButton>
      <Popover
        placement="right top"
        className={css({
          bg: "white",
          borderRadius: "md",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "gray.200",
          boxShadow: "sm",
          height: "300px",
          overflowY: "auto",
          zIndex: "popover",
        })}
      >
        <OverlayArrow
          className={css({ "& svg": { display: "block", fill: "white" } })}
        >
          <svg width={12} height={12} viewBox="0 0 12 12">
            <path d="M0 0 L6 6 L12 0" />
          </svg>
        </OverlayArrow>
        <Dialog
          aria-label={intl.formatMessage({
            id: "select-icon-action-untitled-aria",
          })}
          className={css({ outline: "none", p: 4 })}
        >
          {({ close }) => (
            <Grid gridTemplateColumns="repeat(4, 1fr)" gap={4}>
              {Object.keys(makecodeIcons).map((icon, idx) => (
                <IconButton
                  key={idx}
                  aria-label={intl.formatMessage(
                    { id: "select-icon-option-action-aria" },
                    {
                      iconName: intl.formatMessage({
                        id: `led-icon-option-${icon.toLowerCase()}`,
                      }),
                    }
                  )}
                  onPress={() => handleClick(icon as MakeCodeIcon, close)}
                  variant="unstyled"
                  css={{ h: 20, w: 20, cursor: "pointer" }}
                >
                  <LedIconSvg icon={icon as MakeCodeIcon} />
                </IconButton>
              ))}
            </Grid>
          )}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
};

export default memo(LedIconPicker);
