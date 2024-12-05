/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Grid,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
} from "@chakra-ui/react";
import { memo, useCallback } from "react";
import { RiArrowDropDownFill } from "react-icons/ri";
import { useIntl } from "react-intl";
import { MakeCodeIcon, makecodeIcons } from "../utils/icons";
import LedIconSvg from "./icons/LedIconSvg";

interface LedIconPicker {
  actionName: string;
  onIconSelected: (icon: MakeCodeIcon) => void;
}

const LedIconPicker = ({ actionName, onIconSelected }: LedIconPicker) => {
  const intl = useIntl();
  const handleClick = useCallback(
    (icon: MakeCodeIcon, callback: () => void) => {
      onIconSelected(icon);
      callback();
    },
    [onIconSelected]
  );

  return (
    <Popover placement="right-start" isLazy lazyBehavior="keepMounted">
      {({ onClose }) => (
        <>
          <PopoverTrigger>
            <IconButton
              variant="ghost"
              color="blackAlpha.700"
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
              size="sm"
            >
              <RiArrowDropDownFill size={32} />
            </IconButton>
          </PopoverTrigger>
          <Portal>
            <PopoverContent w="100%" height="300px" overflowY="auto">
              <PopoverArrow />
              <PopoverBody p={4}>
                <Grid templateColumns="repeat(4, 1fr)" gap={4}>
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
                      onClick={() => handleClick(icon as MakeCodeIcon, onClose)}
                      variant="unstyled"
                      h={20}
                      w={20}
                      icon={<LedIconSvg icon={icon as MakeCodeIcon} />}
                    />
                  ))}
                </Grid>
              </PopoverBody>
            </PopoverContent>
          </Portal>
        </>
      )}
    </Popover>
  );
};

export default memo(LedIconPicker);
