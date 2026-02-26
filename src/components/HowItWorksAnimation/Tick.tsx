import { Icon, IconProps } from "@chakra-ui/react";

interface TickProps extends IconProps {
  size?: string
}

const Tick = ({ size, ...props }: TickProps) => {
  return (
    <Icon
      viewBox="0 0 24 17.1"
      color="brand2.500"
      width={size}
      height={size}
      {...props}
    >
      <path
        fill="currentColor"
        d="M9.2,17.1c-.6,0-1-.2-1.3-.5L.6,9.6c-.8-.8-.8-1.9,0-2.7.8-.8,1.9-.8,2.7,0l5.8,5.7L20.7.6c.8-.8,2-.8,2.7,0,.8.8.8,1.9,0,2.7l-12.9,13.3c-.4.3-.9.5-1.4.5"
      />
    </Icon>
  );
};

export default Tick;
