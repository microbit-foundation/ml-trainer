import { MenuItem, MenuItemProps } from "@chakra-ui/react";
import { useRef } from "react";
import LoadProjectInput, {
  LoadProjectInputProps,
  LoadProjectInputRef,
} from "./LoadProjectInput";

interface LoadProjectMenuItemProps
  extends MenuItemProps,
    LoadProjectInputProps {
  /**
   *
   * File input tag accept attribute.
   * A project can be opened from .json or .hex file.
   */
  accept: ".json" | ".hex" | ".json,.hex";
}

const LoadProjectMenuItem = ({
  accept,
  ...props
}: LoadProjectMenuItemProps) => {
  const ref = useRef<LoadProjectInputRef>(null);
  return (
    <>
      <MenuItem {...props} onClick={() => ref.current?.chooseFile()} />
      <LoadProjectInput ref={ref} accept={accept} />
    </>
  );
};

export default LoadProjectMenuItem;
