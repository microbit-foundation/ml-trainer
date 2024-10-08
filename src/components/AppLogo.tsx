import { As, Divider, HStack } from "@chakra-ui/react";
import { useDeployment } from "../deployment";

const AppLogo = ({
  color = "#FFF",
  as,
}: {
  color?: string;
  beta?: boolean;
  as?: As;
}) => {
  const { AppLogo, OrgLogo } = useDeployment();
  return (
    <HStack
      as={as}
      spacing={4}
      userSelect="none"
      transform="scale(0.93)"
      transformOrigin="left"
    >
      {OrgLogo && (
        <>
          <OrgLogo color="white" />
          <Divider
            aria-hidden
            borderColor={color}
            orientation="vertical"
            h="33px"
            borderWidth="1px"
          />
        </>
      )}
      <AppLogo h="19px" color="white" />
    </HStack>
  );
};

export default AppLogo;
