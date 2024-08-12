import {
  Grid,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
} from "@chakra-ui/react";
import { useCallback } from "react";
import { RiArrowDropDownFill } from "react-icons/ri";
import { MakeCodeIcon, makecodeIcons } from "../utils/icons";
import LedIcon from "./LedIcon";

interface LedIconPicker {
  onIconSelected: (icon: MakeCodeIcon) => void;
}

const LedIconPicker = ({ onIconSelected }: LedIconPicker) => {
  const handleClick = useCallback(
    (icon: MakeCodeIcon, callback: () => void) => {
      onIconSelected(icon);
      callback();
    },
    [onIconSelected]
  );

  return (
    <Popover placement="bottom-end">
      {({ onClose }) => (
        <>
          <PopoverTrigger>
            <IconButton
              variant="ghost"
              color="blackAlpha.700"
              aria-label="Pick icon"
              size="sm"
            >
              <RiArrowDropDownFill size="lg" />
            </IconButton>
          </PopoverTrigger>
          <PopoverContent w="100%" height="300px" overflowY="auto">
            <PopoverArrow />
            <PopoverBody p={4}>
              <Grid templateColumns="repeat(4, 1fr)" gap={4}>
                {Object.keys(makecodeIcons).map((icon, idx) => (
                  <IconButton
                    key={idx}
                    aria-label={`Select ${icon} icon`}
                    onClick={() => handleClick(icon as MakeCodeIcon, onClose)}
                    variant="unstyled"
                    h={20}
                    w={20}
                  >
                    <LedIcon icon={icon as MakeCodeIcon} />
                  </IconButton>
                ))}
              </Grid>
            </PopoverBody>
          </PopoverContent>
        </>
      )}
    </Popover>
  );
};

export default LedIconPicker;
