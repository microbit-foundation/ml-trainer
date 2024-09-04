import { Flex, HStack, IconButton, VStack } from "@chakra-ui/react";
import { ReactNode, useCallback, useEffect } from "react";
import { RiHome2Line } from "react-icons/ri";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router";
import { TOOL_NAME } from "../constants";
import { createHomePageUrl } from "../urls";
import ActionBar from "./ActionBar";
import AppLogo from "./AppLogo";
import ConnectionDialogs from "./ConnectionFlowDialogs";
import HelpMenu from "./HelpMenu";
import PrototypeVersionWarning from "./PrototypeVersionWarning";
import SettingsMenu from "./SettingsMenu";
import { stage } from "../environment";

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
  const navigate = useNavigate();

  useEffect(() => {
    document.title = intl.formatMessage({ id: titleId });
  }, [intl, titleId]);

  const handleHomeClick = useCallback(() => {
    navigate(createHomePageUrl());
  }, [navigate]);

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
          zIndex={2}
          position="sticky"
          top={0}
          itemsLeft={<AppLogo name={TOOL_NAME} />}
          itemsRight={
            <HStack spacing={3}>
              {toolbarItemsRight}
              <IconButton
                onClick={handleHomeClick}
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
        {(stage === "staging" || stage === "production") && (
          <PrototypeVersionWarning />
        )}
        <Flex flexGrow={1} flexDir="column">
          {children}
        </Flex>
      </VStack>
    </>
  );
};

export default DefaultPageLayout;
