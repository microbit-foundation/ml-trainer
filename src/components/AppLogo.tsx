import { As, Divider, HStack, Image } from "@chakra-ui/react";
import AppNameLogo from "../images/app-name.svg";
import MicrobitLogo from "./MicrobitLogo";

const AppLogo = ({
  color = "#FFF",
  as,
}: {
  color?: string;
  beta?: boolean;
  as?: As;
  name: string;
}) => (
  <HStack
    as={as}
    spacing={4}
    userSelect="none"
    transform="scale(0.93)"
    transformOrigin="left"
  >
    <MicrobitLogo fill={color} alt="micro:bit" />
    <Divider
      aria-hidden
      borderColor={color}
      orientation="vertical"
      h="33px"
      borderWidth="1px"
    />
    <Image src={AppNameLogo} alt="micro:bit" h="18px" />
  </HStack>
);

export default AppLogo;
