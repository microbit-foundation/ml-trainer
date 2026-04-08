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
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { ReactNode, useCallback, useEffect, useMemo } from "react";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import {
  RiDownload2Line,
  RiHome2Line,
  RiMenuLine,
  RiShareLine,
} from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useLocation, useNavigate } from "react-router";
import { isDataConnectionDialogOpen } from "../data-connection-flow";
import { useDeployment } from "../deployment";
import { flags } from "../flags";
import { useNativeTabletBreakpoint } from "../native-breakpoint-hooks";
import { useProject } from "../hooks/project-hooks";
import { keyboardShortcuts, useShortcut } from "../keyboard-shortcut-hooks";
import { PostImportDialogState, SaveType } from "../model";
import Tour from "../pages/Tour";
import { useStore } from "../store";
import { createHomePageUrl } from "../urls";
import ActionBar from "./ActionBar/ActionBar";
import ItemsRight from "./ActionBar/ActionBarItemsRight";
import AppLogo from "./AppLogo";
import BackArrow from "./BackArrow";
import DataConnectionDialogs from "./DataConnectionDialogs";
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
import { isIOS, isNativePlatform } from "../platform";

interface DefaultPageLayoutProps {
  titleId?: string;
  children: ReactNode;

  toolbarItemsRight?: ReactNode;
  /**
   * Content to render at the bottom of the page with safe area padding.
   * Use this for fixed bottom bars with action buttons, live graphs, etc.
   */
  bottomContent?: ReactNode;
  showPageTitle?: boolean;
  showProjectName?: boolean;
  backUrl?: string;
  backLabelId?: string;
}

const backButtonBreakpoint = "@media (min-width: 52.25em)";

const DefaultPageLayout = ({
  titleId,
  children,

  toolbarItemsRight,
  showPageTitle = false,
  showProjectName,
  backUrl,
  backLabelId,
  bottomContent,
}: DefaultPageLayoutProps) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const isConnectionDialogOpen = useStore((s) =>
    isDataConnectionDialogOpen(s.dataConnection.step)
  );
  const isNonConnectionDialogOpen = useStore((s) =>
    s.isNonConnectionDialogOpen()
  );
  const { appNameFull } = useDeployment();
  const drawer = useDisclosure();
  const useTabletLayout = useNativeTabletBreakpoint();

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
      {!isNonConnectionDialogOpen && <DataConnectionDialogs />}
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
          h="100vh"
          w="100%"
          alignItems="stretch"
          spacing={0}
          bgColor="whitesmoke"
          overflow="hidden"
          sx={{
            // Handle landscape orientation where nav bar moves to side.
            // Uses heuristic: larger inset is nav bar, smaller is camera cutout.
            paddingLeft: "var(--safe-area-nav-left, 0px)",
            paddingRight: "var(--safe-area-nav-right, 0px)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <VStack zIndex={999} position="sticky" top={0} gap={0}>
            <ActionBar
              w="100%"
              px={{ base: 2, md: 5 }}
              itemsCenterProps={{ overflow: "hidden" }}
              itemsCenter={
                showProjectName || showPageTitle ? (
                  <HStack h={10} w="100%" justifyContent="center">
                    {/* Desktop/tablet: show project name + page title */}
                    {showProjectName && (
                      <Box display={{ base: "none", md: "block" }} w="100%">
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
                ) : (
                  /* Mobile/tablet: centered app logo when no page title */
                  <Box display={useTabletLayout ? "flex" : "none"}>
                    <AppLogo transform="scale(0.8)" transformOrigin="center" />
                  </Box>
                )
              }
              itemsLeft={
                <>
                  {/* Mobile: back arrow (when backUrl set) or hamburger */}
                  {backUrl ? (
                    <IconButton
                      display="inline-flex"
                      sx={{
                        [backButtonBreakpoint]: {
                          display: "none",
                        },
                      }}
                      aria-label={intl.formatMessage({
                        id: backLabelId ?? "back-action",
                      })}
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
                      display={useTabletLayout ? "inline-flex" : "none"}
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
                  {/* Tablet/desktop: back button with label */}
                  {backUrl && (
                    <Button
                      display="none"
                      sx={{
                        [backButtonBreakpoint]: {
                          display: "inline-flex",
                        },
                      }}
                      leftIcon={<BackArrow />}
                      variant="toolbar"
                      onClick={() => navigate(backUrl)}
                    >
                      <FormattedMessage id={backLabelId ?? "back-action"} />
                    </Button>
                  )}
                  {/* Desktop: logo (when no backUrl) */}
                  {!backUrl && (
                    <Link
                      href={createHomePageUrl()}
                      display={useTabletLayout ? "none" : "inline-flex"}
                      _focusVisible={{
                        boxShadow: "outlineDark",
                        borderRadius: "md",
                      }}
                    >
                      <AppLogo
                        transform={{ base: "scale(0.8)", sm: "scale(0.93)" }}
                      />
                    </Link>
                  )}
                </>
              }
              itemsRight={
                <>
                  <ItemsRight toolbarItems={toolbarItemsRight} />
                  {/* Mobile/tablet: right-side hamburger when back arrow is on the left */}
                  {backUrl && (
                    <IconButton
                      display={useTabletLayout ? "inline-flex" : "none"}
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
          <Flex flexGrow={1} flexDir="column" overflow="auto">
            {children}
          </Flex>
          {bottomContent && (
            <VStack w="full" flexShrink={0} gap={0} bg="gray.25">
              {bottomContent}
            </VStack>
          )}
        </VStack>
      </ProjectDropTarget>
    </>
  );
};

export const ProjectToolbarItems = () => {
  const { saveHex } = useProject();
  const handleSave = useCallback(() => {
    void saveHex(SaveType.Download);
  }, [saveHex]);
  const handleShare = useCallback(() => {
    void saveHex(SaveType.Share);
  }, [saveHex]);
  useShortcut(keyboardShortcuts.saveSession, handleSave);

  const canShare = isNativePlatform();
  const shareOnly = isIOS();

  return (
    <>
      {shareOnly ? (
        <Button
          variant="toolbar"
          leftIcon={<RiShareLine />}
          onClick={handleShare}
        >
          <FormattedMessage id="share-action" />
        </Button>
      ) : canShare ? (
        <Menu>
          <MenuButton as={Button} leftIcon={<RiShareLine />} variant="toolbar">
            <FormattedMessage id="share-action" />
          </MenuButton>

          <MenuList zIndex={2}>
            <MenuItem
              onClick={handleSave}
              icon={<Icon h={5} w={5} as={RiDownload2Line} />}
            >
              <FormattedMessage id="save-to-files-action" />
            </MenuItem>
            <MenuItem
              onClick={handleShare}
              icon={<Icon h={5} w={5} as={RiShareLine} />}
            >
              <FormattedMessage id="share-action" />
            </MenuItem>
          </MenuList>
        </Menu>
      ) : (
        <Button
          variant="toolbar"
          leftIcon={<RiDownload2Line />}
          onClick={handleSave}
        >
          <FormattedMessage id="save-action" />
        </Button>
      )}
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

export default DefaultPageLayout;
