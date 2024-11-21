import { Divider, HStack, StackProps } from "@chakra-ui/react";
import { useDeployment } from "../deployment";

interface AppLogoProps extends StackProps {
  color?: string;
}

const AppLogo = ({ color = "#FFF", ...props }: AppLogoProps) => {
  const { AppLogo, OrgLogo } = useDeployment();
  return (
    <HStack
      gap={4}
      userSelect="none"
      transform="scale(0.93)"
      transformOrigin="left"
      color="white"
      {...props}
    >
      {OrgLogo && (
        <>
          <OrgLogo />
          <Divider
            aria-hidden
            borderColor={color}
            orientation="vertical"
            h="33px"
            borderWidth="1px"
          />
        </>
      )}
      <AppLogo h="19px" />
    </HStack>
  );
};

export default AppLogo;
