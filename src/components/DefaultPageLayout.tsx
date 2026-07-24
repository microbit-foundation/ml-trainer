/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import {
  RiDownload2Line,
  RiHome2Line,
  RiMenuLine,
  RiShareLine,
} from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useLocation, useNavigate } from "react-router";
import { Link as RouterLink } from "react-router-dom";
import { isDataConnectionDialogOpen } from "../data-connection-flow";
import { useDeployment } from "../deployment";
import { flags } from "../flags";
import { useProject } from "../hooks/project-hooks";
import { keyboardShortcuts, useShortcut } from "../keyboard-shortcut-hooks";
import { PostImportDialogState, SaveType } from "../model";
import { useNativeTabletBreakpoint } from "../native-breakpoint-hooks";
import Tour from "../pages/Tour";
import { isIOS, isNativePlatform } from "../platform";
import {
  Box,
  Button,
  css,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  MenuItem,
  MenuList,
  MenuTrigger,
  VStack,
} from "@microbit/ui";
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
import MakeCodeLoadErrorDialog from "./MakeCodeLoadErrorDialog";
import NavigationDrawer from "./NavigationDrawer";
import NotCreateAiHexImportDialog from "./NotCreateAiHexImportDialog";
import PreReleaseNotice from "./PreReleaseNotice";
import ProjectDropTarget from "./ProjectDropTarget";
import SaveDialogs from "./SaveDialogs";

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
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const drawerOnOpen = useCallback(() => setDrawerOpen(true), []);
  const drawerOnClose = useCallback(() => setDrawerOpen(false), []);
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
        isOpen={isDrawerOpen}
        onClose={drawerOnClose}
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
          gap={0}
          bg="whitesmoke"
          overflow="hidden"
          css={{
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
                                  css={{
                                    color: "white",
                                    width: 6,
                                    height: 6,
                                  }}
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
                    <AppLogo
                      css={{
                        transform: "scale(0.8)",
                        transformOrigin: "center",
                      }}
                    />
                  </Box>
                )
              }
              itemsLeft={
                <>
                  {/* Mobile: back arrow (when backUrl set) or hamburger */}
                  {backUrl ? (
                    <IconButton
                      variant="plain"
                      size="lg"
                      aria-label={intl.formatMessage({
                        id: backLabelId ?? "back-action",
                      })}
                      onPress={() => navigate(backUrl)}
                      css={{
                        display: "inline-flex",
                        [backButtonBreakpoint]: {
                          display: "none",
                        },
                        color: "white",
                        fontSize: "xl",
                        _focusVisible: {
                          focusShadow: "outlineDark",
                        },
                      }}
                    >
                      <BackArrow />
                    </IconButton>
                  ) : (
                    <IconButton
                      variant="plain"
                      size="lg"
                      aria-label={intl.formatMessage({ id: "main-menu" })}
                      onPress={drawerOnOpen}
                      css={{
                        display: useTabletLayout ? "inline-flex" : "none",
                        color: "white",
                        _focusVisible: {
                          focusShadow: "outlineDark",
                        },
                      }}
                    >
                      <RiMenuLine size={24} />
                    </IconButton>
                  )}
                  {/* Tablet/desktop: back button with label */}
                  {backUrl && (
                    <Button
                      variant="toolbar"
                      leftIcon={<BackArrow />}
                      onPress={() => navigate(backUrl)}
                      css={{
                        display: "none",
                        [backButtonBreakpoint]: {
                          display: "inline-flex",
                        },
                      }}
                    >
                      <FormattedMessage id={backLabelId ?? "back-action"} />
                    </Button>
                  )}
                  {/* Desktop: logo (when no backUrl) */}
                  {!backUrl && (
                    <RouterLink
                      to={createHomePageUrl()}
                      className={css({
                        display: useTabletLayout ? "none" : "inline-flex",
                        outline: "none",
                        _focusVisible: {
                          focusShadow: "outlineDark",
                          borderRadius: "md",
                        },
                      })}
                    >
                      <AppLogo
                        css={{
                          transform: {
                            base: "scale(0.8)",
                            sm: "scale(0.93)",
                          },
                        }}
                      />
                    </RouterLink>
                  )}
                </>
              }
              itemsRight={
                <>
                  <ItemsRight toolbarItems={toolbarItemsRight} />
                  {/* Mobile/tablet: right-side hamburger when back arrow is on the left */}
                  {backUrl && (
                    <IconButton
                      variant="plain"
                      size="lg"
                      aria-label={intl.formatMessage({ id: "main-menu" })}
                      onPress={drawerOnOpen}
                      css={{
                        display: useTabletLayout ? "inline-flex" : "none",
                        color: "white",
                        _focusVisible: {
                          focusShadow: "outlineDark",
                        },
                      }}
                    >
                      <RiMenuLine size={24} />
                    </IconButton>
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
  const intl = useIntl();
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
          leftIcon={<Icon as={RiShareLine} />}
          onPress={handleShare}
        >
          <FormattedMessage id="share-action" />
        </Button>
      ) : canShare ? (
        <MenuTrigger>
          <Button variant="toolbar" leftIcon={<Icon as={RiShareLine} />}>
            <FormattedMessage id="share-action" />
          </Button>
          <MenuList>
            <MenuItem
              onAction={handleSave}
              icon={<Icon as={RiDownload2Line} css={{ width: 5, height: 5 }} />}
              textValue={intl.formatMessage({ id: "save-to-files-action" })}
            >
              <FormattedMessage id="save-to-files-action" />
            </MenuItem>
            <MenuItem
              onAction={handleShare}
              icon={<Icon as={RiShareLine} css={{ width: 5, height: 5 }} />}
              textValue={intl.formatMessage({ id: "share-action" })}
            >
              <FormattedMessage id="share-action" />
            </MenuItem>
          </MenuList>
        </MenuTrigger>
      ) : (
        <Button
          variant="toolbar"
          leftIcon={<Icon as={RiDownload2Line} />}
          onPress={handleSave}
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
      onPress={handleHomeClick}
      variant="plain"
      size="lg"
      aria-label={intl.formatMessage({ id: "homepage" })}
      css={{
        color: "white",
        _focusVisible: {
          focusShadow: "outlineDark",
        },
      }}
    >
      <RiHome2Line size={24} />
    </IconButton>
  );
};

export default DefaultPageLayout;
