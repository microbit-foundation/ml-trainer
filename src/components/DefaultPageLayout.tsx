/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  Flex,
  Heading,
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
import { useConnectionStage } from "../connection-stage-hooks";
import { useDeployment } from "../deployment";
import { flags } from "../flags";
import { useProject } from "../hooks/project-hooks";
import {
  keyboardShortcuts,
  useKeyboardShortcut,
} from "../keyboard-shortcut-hooks";
import { PostImportDialogState } from "../model";
import Tour from "../pages/Tour";
import { useStore } from "../store";
import { createHomePageUrl } from "../urls";
import ActionBar from "./ActionBar/ActionBar";
import ItemsRight from "./ActionBar/ActionBarItemsRight";
import AppLogo from "./AppLogo";
import ConnectionDialogs from "./ConnectionFlowDialogs";
import FeedbackForm from "./FeedbackForm";
import ImportErrorDialog from "./ImportErrorDialog";
import MakeCodeLoadErrorDialog from "./MakeCodeLoadErrorDialog";
import NotCreateAiHexImportDialog from "./NotCreateAiHexImportDialog";
import PreReleaseNotice from "./PreReleaseNotice";
import ProjectDropTarget from "./ProjectDropTarget";
import SaveDialogs from "./SaveDialogs";

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
  const { isDialogOpen: isConnectionDialogOpen } = useConnectionStage();
  const isNonConnectionDialogOpen = useStore((s) =>
    s.isNonConnectionDialogOpen()
  );
  const { appNameFull } = useDeployment();

  useEffect(() => {
    document.title = titleId
      ? `${intl.formatMessage({ id: titleId })} | ${appNameFull}`
      : appNameFull;
  }, [appNameFull, intl, titleId]);

  const postImportDialogState = useStore((s) => s.postImportDialogState);
  const setPostImportDialogState = useStore((s) => s.setPostImportDialogState);
  const closePostImportDialog = useCallback(() => {
    setPostImportDialogState(PostImportDialogState.None);
  }, [setPostImportDialogState]);

  const isFeedbackOpen = useStore((s) => s.isFeedbackFormOpen);
  const closeDialog = useStore((s) => s.closeDialog);

  return (
    <>
      {/* Suppress dialogs to prevent overlapping dialogs */}
      {!isNonConnectionDialogOpen && <ConnectionDialogs />}
      <Tour />
      <SaveDialogs />
      <NotCreateAiHexImportDialog
        onClose={closePostImportDialog}
        isOpen={postImportDialogState === PostImportDialogState.NonCreateAiHex}
      />
      <ImportErrorDialog
        onClose={closePostImportDialog}
        isOpen={postImportDialogState === PostImportDialogState.Error}
      />
      <MakeCodeLoadErrorDialog />
      <FeedbackForm isOpen={isFeedbackOpen} onClose={closeDialog} />
      <ProjectDropTarget
        isEnabled={!isNonConnectionDialogOpen && !isConnectionDialogOpen}
      >
        <VStack
          minH="100vh"
          w="100%"
          alignItems="stretch"
          spacing={0}
          bgColor="whitesmoke"
        >
          <VStack zIndex={999} position="sticky" top={0} gap={0}>
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
                    display={
                      showPageTitle
                        ? { base: "none", md: "inline-flex" }
                        : "inline-flex"
                    }
                    transform={{ base: "scale(0.8)", sm: "scale(0.93)" }}
                  />
                )
              }
              itemsLeftProps={{ width: 0 }}
              itemsRight={
                <ItemsRight
                  menuItems={menuItems}
                  toolbarItems={toolbarItemsRight}
                />
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
  useKeyboardShortcut(keyboardShortcuts.saveSession, handleSave);

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
      color="white"
      icon={<RiHome2Line size={24} />}
      aria-label={intl.formatMessage({ id: "homepage" })}
      variant="plain"
      size="lg"
      fontSize="xl"
      _focusVisible={{
        boxShadow: "outlineDark",
      }}
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
