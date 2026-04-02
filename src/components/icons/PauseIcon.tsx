import { Icon, IconProps } from "@chakra-ui/react";

const PauseIcon = (props: IconProps) => {
  return (
    <Icon viewBox="0 0 163 163" {...props}>
      <rect x="50" y="35" width="20" height="93" fill="currentColor" />
      <rect x="92" y="35" width="20" height="93" fill="currentColor" />
    </Icon>
  );
};

export default PauseIcon;
