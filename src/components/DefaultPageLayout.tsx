/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  MenuDivider,
  MenuItem,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { ReactNode, useCallback, useEffect, useMemo } from "react";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { RiDownload2Line, RiHome2Line, RiMenuLine } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useLocation, useNavigate } from "react-router";
import { useConnectionStage } from "../connection-stage-hooks";
import { useDeployment } from "../deployment";
import { flags } from "../flags";
import { useProject } from "../hooks/project-hooks";
import { keyboardShortcuts, useShortcut } from "../keyboard-shortcut-hooks";
import { PostImportDialogState } from "../model";
import Tour from "../pages/Tour";
import { useStore } from "../store";
import { createHomePageUrl } from "../urls";
import ActionBar from "./ActionBar/ActionBar";
import ItemsRight from "./ActionBar/ActionBarItemsRight";
import AppLogo from "./AppLogo";
import BackArrow from "./BackArrow";
import ConnectionDialogs from "./ConnectionFlowDialogs";
import EditableName from "./EditableName";
import FeedbackForm from "./FeedbackForm";
import { tourMap } from "./HelpMenuItems";
import ImportErrorDialog from "./ImportErrorDialog";
import Link from "./Link";
import MakeCodeLoadErrorDialog from "./MakeCodeLoadErrorDialog";
import NavigationDrawer from "./NavigationDrawer";
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
  showProjectName?: boolean;
  backUrl?: string;
  backLabelId?: string;
}

const DefaultPageLayout = ({
  titleId,
  children,
  menuItems,
  toolbarItemsLeft,
  toolbarItemsRight,
  showPageTitle = false,
  showProjectName,
  backUrl,
  backLabelId,
}: DefaultPageLayoutProps) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { isDialogOpen: isConnectionDialogOpen } = useConnectionStage();
  const isNonConnectionDialogOpen = useStore((s) =>
    s.isNonConnectionDialogOpen()
  );
  const { appNameFull } = useDeployment();
  const drawer = useDisclosure();

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

  const tourTriggerName = tourMap[useLocation().pathname];
  const tourTrigger = useMemo(() => {
    switch (tourTriggerName) {
      case "TrainModel": {
        return {
          name: tourTriggerName,
          delayedUntilConnection: true,
        };
      }
      case "Connect": {
        return { name: tourTriggerName };
      }
      default: {
        return undefined;
      }
    }
  }, [tourTriggerName]);

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
      <NavigationDrawer
        isOpen={drawer.isOpen}
        onClose={drawer.onClose}
        placement={backUrl ? "right" : "left"}
        showProjectName={showProjectName}
        tourTrigger={tourTrigger}
      />
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
              px={{ base: 2, md: 5 }}
              itemsCenter={
                showProjectName || showPageTitle ? (
                  <HStack h={10}>
                    {/* Desktop/tablet: show project name + page title */}
                    {showProjectName && (
                      <Box display={{ base: "none", md: "flex" }}>
                        <EditableName
                          suffix={
                            showPageTitle ? (
                              <>
                                <Icon
                                  as={MdOutlineKeyboardArrowRight}
                                  color="white"
                                  boxSize="6"
                                />
                                <Heading
                                  size="md"
                                  fontWeight="normal"
                                  color="white"
                                >
                                  <FormattedMessage id={titleId} />
                                </Heading>
                              </>
                            ) : undefined
                          }
                        />
                      </Box>
                    )}
                    {/* Mobile: page title only (project name is in drawer) */}
                    {showPageTitle && showProjectName && (
                      <Heading
                        display={{ base: "block", md: "none" }}
                        size="md"
                        fontWeight="normal"
                        color="white"
                      >
                        <FormattedMessage id={titleId} />
                      </Heading>
                    )}
                    {/* All breakpoints: page title when no project name */}
                    {showPageTitle && !showProjectName && (
                      <Heading size="md" fontWeight="normal" color="white">
                        <FormattedMessage id={titleId} />
                      </Heading>
                    )}
                  </HStack>
                ) : undefined
              }
              itemsLeft={
                <>
                  {/* Mobile: back arrow (when backUrl set) or hamburger */}
                  {backUrl ? (
                    <IconButton
                      display={{ base: "inline-flex", md: "none" }}
                      aria-label={intl.formatMessage({ id: "back-action" })}
                      icon={<BackArrow />}
                      color="white"
                      variant="plain"
                      size="lg"
                      fontSize="xl"
                      onClick={() => navigate(backUrl)}
                      _focusVisible={{
                        boxShadow: "outlineDark",
                      }}
                    />
                  ) : (
                    <IconButton
                      display={{ base: "inline-flex", md: "none" }}
                      aria-label={intl.formatMessage({ id: "main-menu" })}
                      icon={<RiMenuLine size={24} />}
                      color="white"
                      variant="plain"
                      size="lg"
                      fontSize="xl"
                      onClick={drawer.onOpen}
                      _focusVisible={{
                        boxShadow: "outlineDark",
                      }}
                    />
                  )}
                  {/* Mobile: app logo when no page title */}
                  {!showPageTitle && !showProjectName && (
                    <Box display={{ base: "flex", md: "none" }} ml={1}>
                      <AppLogo transform="scale(0.8)" transformOrigin="left" />
                    </Box>
                  )}
                  {/* Desktop/tablet: back button with label, logo, or custom left items */}
                  {backUrl && backLabelId ? (
                    <Button
                      display={{ base: "none", md: "inline-flex" }}
                      leftIcon={<BackArrow />}
                      variant="toolbar"
                      onClick={() => navigate(backUrl)}
                    >
                      <FormattedMessage id={backLabelId} />
                    </Button>
                  ) : (
                    toolbarItemsLeft || (
                      <Link
                        href={createHomePageUrl()}
                        display={{ base: "none", md: "inline-flex" }}
                        _focusVisible={{
                          boxShadow: "outlineDark",
                          borderRadius: "md",
                        }}
                      >
                        <AppLogo
                          transform={{ base: "scale(0.8)", sm: "scale(0.93)" }}
                        />
                      </Link>
                    )
                  )}
                </>
              }
              itemsLeftProps={{ width: 0 }}
              itemsRight={
                <>
                  <ItemsRight
                    menuItems={menuItems}
                    toolbarItems={toolbarItemsRight}
                  />
                  {/* Mobile: right-side hamburger when back arrow is on the left */}
                  {backUrl && (
                    <IconButton
                      display={{ base: "inline-flex", md: "none" }}
                      aria-label={intl.formatMessage({ id: "main-menu" })}
                      icon={<RiMenuLine size={24} />}
                      color="white"
                      variant="plain"
                      size="lg"
                      fontSize="xl"
                      onClick={drawer.onOpen}
                      _focusVisible={{
                        boxShadow: "outlineDark",
                      }}
                    />
                  )}
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
  useShortcut(keyboardShortcuts.saveSession, handleSave);

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
