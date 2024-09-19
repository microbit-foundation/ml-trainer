import {
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  MenuDivider,
  MenuItem,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { ReactNode, useCallback, useEffect } from "react";
import { RiDownload2Line, RiFolderOpenLine, RiHome2Line } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import { TOOL_NAME } from "../constants";
import { flags } from "../flags";
import { SessionPageId } from "../pages-config";
import { useSettings, useStore } from "../store";
import { createHomePageUrl, createSessionPageUrl } from "../urls";
import ActionBar from "./ActionBar";
import AppLogo from "./AppLogo";
import ConnectionDialogs from "./ConnectionFlowDialogs";
import DownloadProjectDialogs from "./DownloadProjectDialogs";
import HelpMenu from "./HelpMenu";
import LanguageMenuItem from "./LanguageMenuItem";
import LoadProjectMenuItem from "./LoadProjectMenuItem";
import OpenButton from "./OpenButton";
import PrototypeVersionWarning from "./PrototypeVersionWarning";
import SettingsMenu from "./SettingsMenu";
import ToolbarMenu from "./ToolbarMenu";
import TrainModelDialogs from "./TrainModelFlowDialogs";
import { useProject } from "../hooks/project-hooks";
import SaveHelpDialog from "./SaveHelpDialog";
import SaveProgressDialog from "./SaveProgressDialog";

interface DefaultPageLayoutProps {
  titleId: string;
  children: ReactNode;
  toolbarItemsLeft?: ReactNode;
  showPageTitle?: boolean;
  showHomeButton?: boolean;
  showSaveButton?: boolean;
}

const DefaultPageLayout = ({
  titleId,
  children,
  toolbarItemsLeft,
  showPageTitle = false,
  showHomeButton = true,
  showSaveButton = true,
}: DefaultPageLayoutProps) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const isEditorOpen = useStore((s) => s.isEditorOpen);
  const { saveProjectHex } = useProject();
  const [settings] = useSettings();
  const preSaveDialogDisclosure = useDisclosure();
  const saveProgressDisclosure = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    document.title = intl.formatMessage({ id: titleId });
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

  const handleSave = useCallback(async () => {
    preSaveDialogDisclosure.onClose();
    saveProgressDisclosure.onOpen();
    await saveProjectHex();
    saveProgressDisclosure.onClose();
    toast({
      id: "save-complete",
      position: "top",
      duration: 5_000,
      title: intl.formatMessage({ id: "saving-toast-title" }),
      status: "info",
    });
  }, [
    preSaveDialogDisclosure,
    saveProgressDisclosure,
    saveProjectHex,
    toast,
    intl,
  ]);

  const handleSaveClick = useCallback(() => {
    if (settings.showPreSaveHelp) {
      preSaveDialogDisclosure.onOpen();
    } else {
      void handleSave();
    }
  }, [handleSave, preSaveDialogDisclosure, settings.showPreSaveHelp]);

  return (
    <>
      {/* Suppress connection and train dialogs when MakeCode editor is open */}
      {!isEditorOpen && (
        <>
          <ConnectionDialogs />
          <TrainModelDialogs />
          <SaveHelpDialog
            isOpen={preSaveDialogDisclosure.isOpen}
            onClose={preSaveDialogDisclosure.onClose}
            onSave={handleSave}
          />
          <SaveProgressDialog isOpen={saveProgressDisclosure.isOpen} />
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
            <>
              <HStack spacing={3} display={{ base: "none", lg: "flex" }}>
                {showSaveButton && (
                  <Button
                    variant="toolbar"
                    leftIcon={<RiDownload2Line />}
                    onClick={handleSaveClick}
                  >
                    <FormattedMessage id="save-action" />
                  </Button>
                )}
                <OpenButton />
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
                {showSaveButton && (
                  <MenuItem
                    onClick={handleSaveClick}
                    icon={<Icon h={5} w={5} as={RiDownload2Line} />}
                  >
                    <FormattedMessage id="save-action" />
                  </MenuItem>
                )}
                <LoadProjectMenuItem
                  icon={<Icon h={5} w={5} as={RiFolderOpenLine} />}
                  accept=".hex"
                >
                  <FormattedMessage id="open-file-action" />
                </LoadProjectMenuItem>
                {showHomeButton && (
                  <>
                    <MenuDivider />
                    <MenuItem
                      onClick={handleHomeClick}
                      icon={<Icon h={5} w={5} as={RiHome2Line} />}
                    >
                      <FormattedMessage id="home-action" />
                    </MenuItem>
                  </>
                )}
                <MenuDivider />
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
