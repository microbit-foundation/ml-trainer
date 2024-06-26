import {
  Box,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuList,
  VStack,
} from "@chakra-ui/react";
import { ReactNode, useEffect, useRef } from "react";
import { RiHome2Line, RiMenuLine } from "react-icons/ri";
import { useIntl } from "react-intl";
import { APP_NAME } from "../constants";
import ActionBar from "./ActionBar";
import AppLogo from "./AppLogo";
import HelpMenu from "./HelpMenu";
import LanguageMenuItem from "./LanguageMenuItem";
import SettingsMenu from "./SettingsMenu";
import PrototypeVersionWarning from "./PrototypeVersionWarning";

interface DefaultPageLayoutProps {
  titleId: string;
  children: ReactNode;
  toolbarItemsRight?: ReactNode;
  toolbarItemsRightMenu?: ReactNode;
  layoutBreakpointOverride?: string;
}

const DefaultPageLayout = ({
  titleId,
  children,
  toolbarItemsRight,
  toolbarItemsRightMenu,
  layoutBreakpointOverride,
}: DefaultPageLayoutProps) => {
  const toolbarHamburgerRef = useRef(null);
  const intl = useIntl();

  useEffect(() => {
    document.title = intl.formatMessage({ id: titleId });
  }, [intl, titleId]);

  return (
    <>
      <VStack
        minH="100dvh"
        w="100%"
        alignItems="stretch"
        spacing={0}
        bgColor="whitesmoke"
      >
        <ActionBar
          position="sticky"
          top={0}
          itemsLeft={<AppLogo name="machine learning tool" />}
          itemsRight={
            <>
              <HStack spacing={3} hideBelow={layoutBreakpointOverride || "lg"}>
                {toolbarItemsRight}
                <IconButton
                  icon={<RiHome2Line size={24} color="white" />}
                  aria-label={intl.formatMessage({ id: "homepage.Link" })}
                  variant="plain"
                  size="lg"
                  fontSize="xl"
                />
                <SettingsMenu />
                <HelpMenu appName={APP_NAME} mode="nextgen" cookies />
              </HStack>
              <HStack hideFrom={layoutBreakpointOverride || "lg"}>
                <HelpMenu appName={APP_NAME} mode="nextgen" cookies />
                <Box>
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      ref={toolbarHamburgerRef}
                      aria-label={intl.formatMessage({ id: "main-menu" })}
                      icon={<RiMenuLine size={24} color="white" />}
                      variant="plain"
                      size="lg"
                      fontSize="xl"
                    />
                    <MenuList zIndex={2}>
                      {toolbarItemsRightMenu}
                      {toolbarItemsRightMenu && <MenuDivider />}
                      <LanguageMenuItem finalFocusRef={toolbarHamburgerRef} />
                    </MenuList>
                  </Menu>
                </Box>
              </HStack>
            </>
          }
        />
        <PrototypeVersionWarning />
        <Flex flexGrow={1} flexDir="column">
          {children}
        </Flex>
      </VStack>
    </>
  );
};

export default DefaultPageLayout;
