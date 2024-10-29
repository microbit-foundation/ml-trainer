import {
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  MenuDivider,
  MenuItem,
  VStack,
} from "@chakra-ui/react";
import { ReactNode, useCallback, useEffect } from "react";
import { RiDownload2Line, RiHome2Line } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import {
  ConnectionFlowStep,
  useConnectionStage,
} from "../connection-stage-hooks";
import { useDeployment } from "../deployment";
import { flags } from "../flags";
import { useProject } from "../hooks/project-hooks";
import { SaveStep, TrainModelDialogStage } from "../model";
import Tour from "../pages/Tour";
import { useStore } from "../store";
import { createHomePageUrl } from "../urls";
import ActionBar from "./ActionBar";
import AppLogo from "./AppLogo";
import ConnectionDialogs from "./ConnectionFlowDialogs";
import HelpMenu from "./HelpMenu";
import LanguageMenuItem from "./LanguageMenuItem";
import PreReleaseNotice from "./PreReleaseNotice";
import ProjectDropTarget from "./ProjectDropTarget";
import SaveDialogs from "./SaveDialogs";
import SettingsMenu from "./SettingsMenu";
import ToolbarMenu from "./ToolbarMenu";
import HelpMenuItems from "./HelpMenuItems";

interface DefaultPageLayoutProps {
  titleId?: string;
  children: ReactNode;
  toolbarItemsLeft?: ReactNode;
  toolbarItemsRight?: ReactNode;
  menuItems?: ReactNode;
  showPageTitle?: boolean;
}

const DefaultPageLayout = ({
  titleId,
  children,
  menuItems,
  toolbarItemsLeft,
  toolbarItemsRight,
  showPageTitle = false,
}: DefaultPageLayoutProps) => {
  const intl = useIntl();
  const isEditorOpen = useStore((s) => s.isEditorOpen);
  const isTourClosed = useStore((s) => s.tourState === undefined);
  const isTrainDialogClosed = useStore(
    (s) => s.trainModelDialogStage === TrainModelDialogStage.Closed
  );
  const { stage } = useConnectionStage();
  const isConnectionDialogClosed = stage.flowStep === ConnectionFlowStep.None;
  const isSaveDialogClosed = useStore((s) => s.save.step === SaveStep.None);
  const { appNameFull } = useDeployment();

  useEffect(() => {
    document.title = titleId
      ? `${intl.formatMessage({ id: titleId })} | ${appNameFull}`
      : appNameFull;
  }, [appNameFull, intl, titleId]);

  return (
    <>
      {/* Suppress dialogs to prevent overlapping dialogs */}
      {!isEditorOpen &&
        isTrainDialogClosed &&
        isTourClosed &&
        isSaveDialogClosed && <ConnectionDialogs />}
      <Tour />
      <SaveDialogs />
      <ProjectDropTarget
        isEnabled={
          isTrainDialogClosed &&
          isTourClosed &&
          isConnectionDialogClosed &&
          isSaveDialogClosed
        }
      >
        <VStack
          minH="100vh"
          w="100%"
          alignItems="stretch"
          spacing={0}
          bgColor="whitesmoke"
        >
          <VStack zIndex={1} position="sticky" top={0} gap={0}>
            <ActionBar
              w="100%"
              px={{ base: 3, sm: 5 }}
              itemsCenter={
                <>
                  {showPageTitle && (
                    <Heading size="md" fontWeight="normal" color="white">
                      <FormattedMessage id={titleId} />
                    </Heading>
                  )}
                </>
              }
              itemsLeft={
                toolbarItemsLeft || (
                  <AppLogo
                    transform={{ base: "scale(0.8)", sm: "scale(0.93)" }}
                  />
                )
              }
              itemsLeftProps={{ width: 0 }}
              itemsRight={
                <>
                  <HStack spacing={3} display={{ base: "none", lg: "flex" }}>
                    {toolbarItemsRight}
                    <SettingsMenu />
                  </HStack>
                  <HelpMenu
                    display={{ base: "none", md: "block", lg: "block" }}
                  />
                  <ToolbarMenu
                    display={{ base: "none", md: "block", lg: "none" }}
                    variant="plain"
                    label={intl.formatMessage({ id: "main-menu" })}
                  >
                    {menuItems}
                    <LanguageMenuItem />
                  </ToolbarMenu>
                  {/* Toolbar items when sm window size. */}
                  <ToolbarMenu
                    display={{ base: "block", md: "none" }}
                    variant="plain"
                    label={intl.formatMessage({ id: "main-menu" })}
                  >
                    {menuItems}
                    <LanguageMenuItem />
                    <MenuDivider />
                    <HelpMenuItems />
                  </ToolbarMenu>
                </>
              }
            />
            {flags.preReleaseNotice && <PreReleaseNotice />}
          </VStack>
          <Flex flexGrow={1} flexDir="column">
            {children}
          </Flex>
        </VStack>
      </ProjectDropTarget>
    </>
  );
};

export const ProjectToolbarItems = () => {
  const { saveHex } = useProject();
  const handleSave = useCallback(() => {
    void saveHex();
  }, [saveHex]);

  return (
    <>
      <Button
        variant="toolbar"
        leftIcon={<RiDownload2Line />}
        onClick={handleSave}
      >
        <FormattedMessage id="save-action" />
      </Button>
      <HomeToolbarItem />
    </>
  );
};

export const HomeToolbarItem = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const handleHomeClick = useCallback(() => {
    navigate(createHomePageUrl());
  }, [navigate]);
  return (
    <IconButton
      onClick={handleHomeClick}
      icon={<RiHome2Line size={24} color="white" />}
      aria-label={intl.formatMessage({ id: "homepage" })}
      variant="plain"
      size="lg"
      fontSize="xl"
    />
  );
};

export const ProjectMenuItems = () => {
  const { saveHex } = useProject();
  const handleSave = useCallback(() => {
    void saveHex();
  }, [saveHex]);

  return (
    <>
      <MenuItem
        onClick={handleSave}
        icon={<Icon h={5} w={5} as={RiDownload2Line} />}
      >
        <FormattedMessage id="save-action" />
      </MenuItem>
      <MenuDivider />
      <HomeMenuItem />
    </>
  );
};

export const HomeMenuItem = () => {
  const navigate = useNavigate();
  const handleHomeClick = useCallback(() => {
    navigate(createHomePageUrl());
  }, [navigate]);
  return (
    <MenuItem
      onClick={handleHomeClick}
      icon={<Icon h={5} w={5} as={RiHome2Line} />}
    >
      <FormattedMessage id="home-action" />
    </MenuItem>
  );
};

export default DefaultPageLayout;
