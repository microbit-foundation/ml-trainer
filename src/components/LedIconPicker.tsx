import {
  Grid,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  useDisclosure,
} from "@chakra-ui/react";
import { memo, useCallback } from "react";
import { RiArrowDropDownFill } from "react-icons/ri";
import { MakeCodeIcon, makecodeIcons } from "../utils/makecode-icons";
import LedIcon from "./LedIcon";

interface LedIconPicker {
  onIconSelected: (icon: MakeCodeIcon) => void;
}

const LedIconPicker = ({ onIconSelected }: LedIconPicker) => {
  const { isOpen, onToggle, onClose } = useDisclosure();

  const handleClick = useCallback(
    (icon: MakeCodeIcon) => {
      onIconSelected(icon);
      onClose();
    },
    [onClose, onIconSelected]
  );

  return (
    <Popover placement="bottom-end" isOpen={isOpen}>
      <PopoverTrigger>
        <IconButton
          variant="ghost"
          color="blackAlpha.700"
          aria-label="Pick icon"
          size="sm"
          onClick={onToggle}
        >
          <RiArrowDropDownFill size="lg" />
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
                  aria-label={`Select ${icon} icon`}
                  onClick={() => handleClick(icon as MakeCodeIcon)}
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
      </Portal>
    </Popover>
  );
};

export default memo(LedIconPicker, () => true);
