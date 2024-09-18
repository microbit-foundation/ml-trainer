import { Flex, Heading, HStack, IconButton, VStack } from "@chakra-ui/react";
import { ReactNode, useCallback, useEffect } from "react";
import { RiHome2Line } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import { TOOL_NAME } from "../constants";
import { flags } from "../flags";
import { createHomePageUrl } from "../urls";
import ActionBar from "./ActionBar";
import AppLogo from "./AppLogo";
import ConnectionDialogs from "./ConnectionFlowDialogs";
import HelpMenu from "./HelpMenu";
import PrototypeVersionWarning from "./PrototypeVersionWarning";
import SettingsMenu from "./SettingsMenu";
import TrainModelDialogs from "./TrainModelFlowDialogs";
import DownloadProjectDialogs from "./DownloadProjectDialogs";
import { useStore } from "../store";

interface DefaultPageLayoutProps {
  titleId: string;
  children: ReactNode;
  toolbarItemsRight?: ReactNode;
  toolbarItemsLeft?: ReactNode;
  showPageTitle?: boolean;
}

const DefaultPageLayout = ({
  titleId,
  children,
  toolbarItemsRight,
  toolbarItemsLeft,
  showPageTitle = false,
}: DefaultPageLayoutProps) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const isEditorOpen = useStore((s) => s.isEditorOpen);

  useEffect(() => {
    document.title = intl.formatMessage({ id: titleId });
  }, [intl, titleId]);

  const handleHomeClick = useCallback(() => {
    navigate(createHomePageUrl());
  }, [navigate]);

  return (
    <>
      {/* Suppress connection and train dialogs when MakeCode editor is open */}
      {!isEditorOpen && (
        <>
          <ConnectionDialogs />
          <TrainModelDialogs />
        </>
      )}
      <DownloadProjectDialogs />
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
          itemsCenter={
            <>
              {showPageTitle && (
                <Heading size="md" fontWeight="normal" color="white">
                  <FormattedMessage id={titleId} />
                </Heading>
              )}
            </>
          }
          itemsLeft={toolbarItemsLeft || <AppLogo name={TOOL_NAME} />}
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
        {flags.prototypeWarning && <PrototypeVersionWarning />}
        <Flex flexGrow={1} flexDir="column">
          {children}
        </Flex>
      </VStack>
    </>
  );
};

export default DefaultPageLayout;
