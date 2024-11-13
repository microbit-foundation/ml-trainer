import {
  Grid,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
} from "@chakra-ui/react";
import { memo, useCallback } from "react";
import { RiArrowDropDownFill } from "react-icons/ri";
import { useIntl } from "react-intl";
import { MakeCodeIcon, makecodeIcons } from "../utils/icons";
import LedIconSvg from "./icons/LedIconSvg";

interface LedIconPicker {
  onIconSelected: (icon: MakeCodeIcon) => void;
}

const LedIconPicker = ({ onIconSelected }: LedIconPicker) => {
  const intl = useIntl();
  const handleClick = useCallback(
    (icon: MakeCodeIcon, callback: () => void) => {
      onIconSelected(icon);
      callback();
    },
    [onIconSelected]
  );

  return (
    <Popover placement="bottom-end" isLazy lazyBehavior="keepMounted">
      {({ onClose }) => (
        <>
          <PopoverTrigger>
            <IconButton
              variant="ghost"
              color="blackAlpha.700"
              aria-label={intl.formatMessage({ id: "select-icon-action-aria" })}
              size="sm"
            >
              <RiArrowDropDownFill size={32} />
            </IconButton>
          </PopoverTrigger>
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
        </>
      )}
    </Popover>
  );
};

export default memo(LedIconPicker);
