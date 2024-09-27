import {
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  MenuDivider,
  MenuItem,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { ReactNode, useCallback, useEffect } from "react";
import { RiDownload2Line, RiFolderOpenLine, RiHome2Line } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import { TOOL_NAME } from "../constants";
import { flags } from "../flags";
import { useProject } from "../hooks/project-hooks";
import { SaveStep, TrainModelDialogStage } from "../model";
import { SessionPageId } from "../pages-config";
import Tour from "../pages/Tour";
import { useSettings, useStore } from "../store";
import { createHomePageUrl, createSessionPageUrl } from "../urls";
import ActionBar from "./ActionBar";
import AppLogo from "./AppLogo";
import ConnectionDialogs from "./ConnectionFlowDialogs";
import DownloadDialogs from "./DownloadDialogs";
import HelpMenu from "./HelpMenu";
import LanguageMenuItem from "./LanguageMenuItem";
import LoadProjectMenuItem from "./LoadProjectMenuItem";
import OpenButton from "./OpenButton";
import PrototypeVersionWarning from "./PrototypeVersionWarning";
import SaveDialogs from "./SaveDialogs";
import SettingsMenu from "./SettingsMenu";
import ToolbarMenu from "./ToolbarMenu";
import TrainModelDialogs from "./TrainModelFlowDialogs";

interface DefaultPageLayoutProps {
  titleId?: string;
  children: ReactNode;
  toolbarItemsLeft?: ReactNode;
  showPageTitle?: boolean;
  showHomeButton?: boolean;
  showSaveButton?: boolean;
  showOpenButton?: boolean;
}

const DefaultPageLayout = ({
  titleId,
  children,
  toolbarItemsLeft,
  showPageTitle = false,
  showHomeButton = false,
  showSaveButton = false,
  showOpenButton = false,
}: DefaultPageLayoutProps) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const isEditorOpen = useStore((s) => s.isEditorOpen);
  const stage = useStore((s) => s.trainModelDialogStage);

  const { saveHex } = useProject();
  const [settings] = useSettings();
  const toast = useToast();

  useEffect(() => {
    const appName = `micro:bit ${TOOL_NAME}`;
    document.title = titleId
      ? `${intl.formatMessage({ id: titleId })} | ${appName}`
      : appName;
  }, [intl, titleId]);

  useEffect(() => {
    return useStore.subscribe(
      (
        { projectLoadTimestamp },
        { projectLoadTimestamp: prevProjectLoadTimestamp }
      ) => {
        if (projectLoadTimestamp > prevProjectLoadTimestamp) {
          // Side effects of loading a project, which MakeCode notifies us of.
          navigate(createSessionPageUrl(SessionPageId.DataSamples));
          toast({
            position: "top",
            duration: 5_000,
            title: intl.formatMessage({ id: "project-loaded" }),
            status: "info",
          });
        }
      }
    );
  }, [intl, navigate, toast]);

  const handleHomeClick = useCallback(() => {
    navigate(createHomePageUrl());
  }, [navigate]);

  const setSave = useStore((s) => s.setSave);
  const handleSave = useCallback(() => {
    if (settings.showPreSaveHelp) {
      setSave({ step: SaveStep.PreSaveHelp });
    } else {
      void saveHex();
    }
  }, [saveHex, setSave, settings.showPreSaveHelp]);

  return (
    <>
      {/* Suppress dialogs to prevent overlapping dialogs */}
      {!isEditorOpen && stage === TrainModelDialogStage.Closed && (
        <ConnectionDialogs />
      )}
      {!isEditorOpen && <TrainModelDialogs />}
      {!isEditorOpen && stage === TrainModelDialogStage.Closed && <Tour />}
      <DownloadDialogs />
      <SaveDialogs />
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
            <>
              <HStack spacing={3} display={{ base: "none", lg: "flex" }}>
                {showOpenButton && <OpenButton />}
                {showSaveButton && (
                  <Button
                    variant="toolbar"
                    leftIcon={<RiDownload2Line />}
                    onClick={handleSave}
                  >
                    <FormattedMessage id="save-action" />
                  </Button>
                )}
                {showHomeButton && (
                  <IconButton
                    onClick={handleHomeClick}
                    icon={<RiHome2Line size={24} color="white" />}
                    aria-label={intl.formatMessage({ id: "homepage.Link" })}
                    variant="plain"
                    size="lg"
                    fontSize="xl"
                  />
                )}
                <SettingsMenu />
              </HStack>
              <HelpMenu appName={TOOL_NAME} cookies />
              <ToolbarMenu
                isMobile
                variant="plain"
                label={intl.formatMessage({ id: "main-menu" })}
              >
                {showOpenButton && (
                  <LoadProjectMenuItem
                    icon={<Icon h={5} w={5} as={RiFolderOpenLine} />}
                    accept=".hex"
                  >
                    <FormattedMessage id="open-file-action" />
                  </LoadProjectMenuItem>
                )}
                {showSaveButton && (
                  <MenuItem
                    onClick={handleSave}
                    icon={<Icon h={5} w={5} as={RiDownload2Line} />}
                  >
                    <FormattedMessage id="save-action" />
                  </MenuItem>
                )}
                <MenuDivider />
                {showHomeButton && (
                  <MenuItem
                    onClick={handleHomeClick}
                    icon={<Icon h={5} w={5} as={RiHome2Line} />}
                  >
                    <FormattedMessage id="home-action" />
                  </MenuItem>
                )}
                <LanguageMenuItem />
              </ToolbarMenu>
            </>
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
