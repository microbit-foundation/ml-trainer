/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode, useCallback, useRef } from "react";
import { IconType } from "react-icons/lib";
import { IoMdGlobe } from "react-icons/io";
import {
  RiDownload2Line,
  RiExternalLinkLine,
  RiFeedbackLine,
  RiFlag2Line,
  RiHome2Line,
  RiListSettingsLine,
  RiShareLine,
} from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import { useDataConnected } from "../data-connection-flow";
import { useDeployment } from "../deployment";
import { useProject } from "../hooks/project-hooks";
import { SaveType, TourTrigger } from "../model";
import { isAndroid, isIOS, isNativePlatform } from "../platform";
import {
  Box,
  css,
  Divider,
  Drawer,
  DrawerBody,
  DrawerHeader,
  HStack,
  Icon,
  Link,
  List,
  ListItem,
  Text,
  VStack,
} from "../shared-ui";
import { useStore } from "../store";
import { createHomePageUrl } from "../urls";
import { userGuideUrl } from "../utils/external-links";
import AppLogo from "./AppLogo";
import EditableName from "./EditableName";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  placement?: "left" | "right";
  showProjectName?: boolean;
  tourTrigger: TourTrigger | undefined;
}

const NavigationDrawer = ({
  isOpen,
  onClose,
  placement = "left",
  showProjectName,
  tourTrigger,
}: NavigationDrawerProps) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const deployment = useDeployment();
  const { saveHex } = useProject();
  const languageDialogOnOpen = useStore((s) => s.languageDialogOnOpen);
  const settingsDialogOnOpen = useStore((s) => s.settingsDialogOnOpen);
  const aboutDialogOnOpen = useStore((s) => s.aboutDialogOnOpen);
  const feedbackOnOpen = useStore((s) => s.feedbackFormOnOpen);
  const connectFirstDialogOnOpen = useStore((s) => s.connectFirstDialogOnOpen);
  const tourStart = useStore((s) => s.tourStart);
  const isConnected = useDataConnected();
  const pendingNavRef = useRef<string | null>(null);
  const onEditRef = useRef<(() => void) | undefined>(undefined);

  const handleCloseComplete = useCallback(() => {
    if (pendingNavRef.current) {
      navigate(pendingNavRef.current);
      pendingNavRef.current = null;
    }
  }, [navigate]);

  const handleHome = useCallback(() => {
    pendingNavRef.current = createHomePageUrl();
    onClose();
  }, [onClose]);

  const handleSave = useCallback(() => {
    onClose();
    void saveHex(SaveType.Download);
  }, [onClose, saveHex]);

  const handleShare = useCallback(() => {
    onClose();
    void saveHex(SaveType.Share);
  }, [onClose, saveHex]);

  const canShare = isNativePlatform();
  const shareOnly = isIOS();

  const handleLanguage = useCallback(() => {
    onClose();
    languageDialogOnOpen();
  }, [onClose, languageDialogOnOpen]);

  const handleSettings = useCallback(() => {
    onClose();
    settingsDialogOnOpen();
  }, [onClose, settingsDialogOnOpen]);

  const handleAbout = useCallback(() => {
    onClose();
    aboutDialogOnOpen();
  }, [onClose, aboutDialogOnOpen]);

  const handleFeedback = useCallback(() => {
    onClose();
    feedbackOnOpen();
  }, [onClose, feedbackOnOpen]);

  const handleTour = useCallback(async () => {
    onClose();
    if (!isConnected) {
      connectFirstDialogOnOpen();
    } else if (tourTrigger) {
      await tourStart(tourTrigger, true);
    }
  }, [onClose, isConnected, connectFirstDialogOnOpen, tourStart, tourTrigger]);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      onCloseComplete={handleCloseComplete}
      placement={placement}
      aria-label={intl.formatMessage({ id: "main-menu" })}
    >
      <DrawerHeader css={{ bg: "brand2.500", px: 0, py: 0 }}>
        <Box h="max(0px, calc(env(safe-area-inset-top) - 12px))" />
        <HStack h="64px" px={4} alignItems="center">
          <AppLogo transform="scale(0.85)" transformOrigin="left" />
        </HStack>
      </DrawerHeader>
      <DrawerBody css={{ px: 0, py: 0 }}>
        <VStack alignItems="stretch" gap={0} h="100%">
          {showProjectName && (
            <Box display={{ base: "block", md: "none" }}>
              <Box
                px={4}
                py={3}
                bg="gray.100"
                cursor="pointer"
                _hover={{ bg: "gray.200" }}
                onClick={() => onEditRef.current?.()}
              >
                <Text fontSize="xs" color="gray.700" mb={1}>
                  <FormattedMessage id="project-label" />
                </Text>
                <EditableName variant="drawer" onEditRef={onEditRef} />
              </Box>
              <Divider borderColor="gray.300" />
            </Box>
          )}
          {/* Project actions (only on project pages) */}
          {showProjectName && (
            <>
              <NavSection>
                {canShare && (
                  <NavItem icon={RiShareLine} onClick={handleShare}>
                    <FormattedMessage id="share-action" />
                  </NavItem>
                )}
                {!shareOnly && (
                  <NavItem icon={RiDownload2Line} onClick={handleSave}>
                    <FormattedMessage
                      id={isAndroid() ? "save-to-files-action" : "save-action"}
                    />
                  </NavItem>
                )}
              </NavSection>

              <Divider borderColor="gray.300" />
            </>
          )}

          {/* Global */}
          <NavSection>
            <NavItem icon={RiHome2Line} onClick={handleHome}>
              <FormattedMessage id="home-action" />
            </NavItem>
            <NavItem icon={IoMdGlobe} onClick={handleLanguage}>
              <FormattedMessage id="language" />
            </NavItem>
            <NavItem icon={RiListSettingsLine} onClick={handleSettings}>
              <FormattedMessage id="settings" />
            </NavItem>
          </NavSection>

          <Divider borderColor="gray.300" />

          {/* Help & support */}
          <NavSection>
            <NavLink href={userGuideUrl()} onClick={onClose}>
              <FormattedMessage id="user-guide" />
            </NavLink>
            {tourTrigger && (
              <NavItem icon={RiFlag2Line} onClick={handleTour}>
                <FormattedMessage id="tour-action" />
              </NavItem>
            )}
            {deployment.supportLinks.main && (
              <NavLink href={deployment.supportLinks.main} onClick={onClose}>
                <FormattedMessage id="help-support" />
              </NavLink>
            )}
            {deployment.accessibilityLink && (
              <NavLink href={deployment.accessibilityLink} onClick={onClose}>
                <FormattedMessage id="accessibility" />
              </NavLink>
            )}
            {deployment.supportLinks.main && (
              <NavItem icon={RiFeedbackLine} onClick={handleFeedback}>
                <FormattedMessage id="feedback" />
              </NavItem>
            )}
          </NavSection>

          <Box flex={1} />

          {/* Footer */}
          <VStack px={4} py={3} gap={2} alignItems="start">
            <Divider borderColor="gray.300" />
            <HStack gap={1} flexWrap="wrap" pt={1}>
              {deployment.termsOfUseLink && (
                <FooterLink href={deployment.termsOfUseLink}>
                  <FormattedMessage id="terms" />
                </FooterLink>
              )}
              {deployment.privacyPolicyLink && (
                <FooterLink href={deployment.privacyPolicyLink}>
                  <FormattedMessage id="privacy" />
                </FooterLink>
              )}
              {deployment.compliance.manageCookies && (
                <FooterButton
                  onClick={() => {
                    onClose();
                    deployment.compliance.manageCookies?.();
                  }}
                >
                  <FormattedMessage id="cookies-action" />
                </FooterButton>
              )}
              <FooterButton onClick={handleAbout}>
                <FormattedMessage id="about" />
              </FooterButton>
            </HStack>
          </VStack>
        </VStack>
      </DrawerBody>
    </Drawer>
  );
};

interface NavSectionProps {
  children: ReactNode;
}

const NavSection = ({ children }: NavSectionProps) => (
  <List py={2}>{children}</List>
);

interface NavItemProps {
  icon: IconType;
  onClick: () => void;
  children: ReactNode;
}

const NavItem = ({ icon, onClick, children }: NavItemProps) => (
  <ListItem>
    <button
      className={css({
        display: "flex",
        alignItems: "center",
        w: "100%",
        px: 4,
        py: 2.5,
        cursor: "pointer",
        bg: "transparent",
        border: "none",
        font: "inherit",
        color: "inherit",
        textAlign: "left",
        outline: "none",
        _hover: { bg: "gray.100" },
        _focusVisible: { boxShadow: "outline" },
      })}
      onClick={onClick}
    >
      <Icon as={icon} css={{ width: 5, height: 5, marginRight: 3 }} />
      {children}
    </button>
  </ListItem>
);

interface NavLinkProps {
  href: string;
  onClick: () => void;
  children: ReactNode;
}

const NavLink = ({ href, onClick, children }: NavLinkProps) => (
  <ListItem>
    <Link
      display="flex"
      alignItems="center"
      w="100%"
      px={4}
      py={2.5}
      color="inherit"
      _hover={{ bg: "gray.100", textDecoration: "none" }}
      href={href}
      target="_blank"
      rel="noopener"
      onClick={onClick}
    >
      <Icon
        as={RiExternalLinkLine}
        css={{ width: 5, height: 5, marginRight: 3 }}
      />
      {children}
    </Link>
  </ListItem>
);

interface FooterLinkProps {
  href: string;
  children: ReactNode;
}

const FooterLink = ({ href, children }: FooterLinkProps) => (
  <Link
    href={href}
    target="_blank"
    rel="noopener"
    fontSize="xs"
    color="gray.600"
    px={1}
  >
    {children}
  </Link>
);

interface FooterButtonProps {
  onClick: () => void;
  children: ReactNode;
}

const FooterButton = ({ onClick, children }: FooterButtonProps) => (
  <button
    onClick={onClick}
    className={css({
      fontSize: "xs",
      color: "gray.600",
      bg: "transparent",
      border: "none",
      font: "inherit",
      cursor: "pointer",
      px: 1,
      outline: "none",
      _hover: { textDecoration: "underline" },
      _focusVisible: { boxShadow: "outline" },
    })}
  >
    {children}
  </button>
);

export default NavigationDrawer;
