import { Flex, HStack, IconButton, VStack } from "@chakra-ui/react";
import { ReactNode, useEffect } from "react";
import { RiHome2Line } from "react-icons/ri";
import { useIntl } from "react-intl";
import { TOOL_NAME } from "../constants";
import ActionBar from "./ActionBar";
import AppLogo from "./AppLogo";
import ConnectionDialogs from "./ConnectionFlowDialogs";
import HelpMenu from "./HelpMenu";
import PrototypeVersionWarning from "./PrototypeVersionWarning";
import SettingsMenu from "./SettingsMenu";

interface DefaultPageLayoutProps {
  titleId: string;
  children: ReactNode;
  toolbarItemsRight?: ReactNode;
}

const DefaultPageLayout = ({
  titleId,
  children,
  toolbarItemsRight,
}: DefaultPageLayoutProps) => {
  const intl = useIntl();

  useEffect(() => {
    document.title = intl.formatMessage({ id: titleId });
  }, [intl, titleId]);

  return (
    <>
      <ConnectionDialogs />
      <VStack
        minH="100dvh"
        w="100%"
        alignItems="stretch"
        spacing={0}
        bgColor="whitesmoke"
      >
        <ActionBar
          position="sticky"
          top={0}
          itemsLeft={<AppLogo name={TOOL_NAME} />}
          itemsRight={
            <HStack spacing={3}>
              {toolbarItemsRight}
              <IconButton
                icon={<RiHome2Line size={24} color="white" />}
                aria-label={intl.formatMessage({ id: "homepage.Link" })}
                variant="plain"
                size="lg"
                fontSize="xl"
              />
              <SettingsMenu />
              <HelpMenu appName={TOOL_NAME} mode="nextgen" cookies />
            </HStack>
          }
        />
        <PrototypeVersionWarning />
        <Flex flexGrow={1} flexDir="column">
          {children}
        </Flex>
      </VStack>
    </>
  );
};

export default DefaultPageLayout;
