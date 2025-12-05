/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Button } from "@chakra-ui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/modal";
import {
  BoxProps,
  HStack,
  Icon,
  Link,
  List,
  ListItem,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  VStack,
  useToast,
} from "@chakra-ui/react";
import React, { useCallback, useRef, useState } from "react";
import {
  RiCheckboxBlankLine,
  RiCheckboxLine,
  RiErrorWarningLine,
  RiExternalLinkLine,
} from "react-icons/ri";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { deployment } from "../deployment";
import { allLanguages, Language } from "../settings";
import { useStore } from "../store";
import { flags } from "../flags";

interface LanguageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  finalFocusRef?: React.RefObject<HTMLButtonElement>;
}

/**
 * Language setting dialog.
 */
export const LanguageDialog = ({
  isOpen,
  onClose,
  finalFocusRef,
}: LanguageDialogProps) => {
  const setLanguage = useStore((s) => s.setLanguage);
  const handleChooseLanguage = useCallback(
    async (languageId: string) => {
      await setLanguage(languageId);
      onClose();
    },
    [onClose, setLanguage]
  );
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      scrollBehavior="outside"
      finalFocusRef={finalFocusRef}
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader fontSize="lg" fontWeight="bold">
            <FormattedMessage id="language" />
          </ModalHeader>
          <ModalBody>
            <VStack spacing={3} width="100%">
              <Text
                as="h2"
                fontSize="md"
                fontWeight="bold"
                textAlign="left"
                width="100%"
              >
                <FormattedMessage id="language-fully-supported-heading" />
              </Text>
              <SimpleGrid width="100%" columns={[1, 2, 3]} spacing={4}>
                {allLanguages
                  .filter((l) => l.makeCode && uiSupported(l))
                  .map((language) => (
                    <LanguageCard
                      key={language.id}
                      language={language}
                      onChooseLanguage={handleChooseLanguage}
                    />
                  ))}
              </SimpleGrid>
              <Text
                marginTop="1em"
                as="h2"
                fontSize="md"
                fontWeight="bold"
                textAlign="left"
                width="100%"
              >
                <FormattedMessage id="language-partially-supported-heading" />
              </Text>
              <SimpleGrid width="100%" columns={[1, 2, 3]} spacing={4}>
                {allLanguages
                  .filter((l) => !(l.makeCode && uiSupported(l)))
                  .map((language) => (
                    <LanguageCard
                      key={language.id}
                      language={language}
                      onChooseLanguage={handleChooseLanguage}
                    />
                  ))}
              </SimpleGrid>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="space-between">
            <Link
              pl={1}
              alignSelf="flex-start"
              href={deployment.translationLink}
              target="_blank"
              rel="noopener"
              color="brand.500"
            >
              <FormattedMessage id="help-translate" />{" "}
              <Icon as={RiExternalLinkLine} />
            </Link>
            <Button variant="primary" onClick={onClose}>
              <FormattedMessage id="close-action" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

interface LanguageCardProps {
  language: Language;
  onChooseLanguage: (languageId: string) => void;
}

const LanguageCard = ({ language, onChooseLanguage }: LanguageCardProps) => {
  const intl = useIntl();
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const handleLanguageSelect = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== tooltipRef.current) {
        onChooseLanguage(language.id);
        if (!fullySupported(language)) {
          toast({
            title: intl.formatMessage({ id: "language-toast-title" }),
            description: (
              <SupportStatement language={language} intl={intl} mt={2} />
            ),
            status: "info",
            duration: 5_000,
            isClosable: true,
            position: "top",
            variant: "toast",
          });
        }
      }
    },
    [intl, language, onChooseLanguage, toast]
  );
  const handleTooltipClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setTooltipOpen(true);
  }, []);
  return (
    <Button
      py={4}
      px={5}
      variant="language"
      alignItems="stretch"
      borderRadius="xl"
      onClick={handleLanguageSelect}
      height="auto"
      data-testid={language.id}
    >
      <VStack alignItems="flex-start" w="100%">
        <Text fontSize="xl" fontWeight="semibold">
          {language.name}
        </Text>
        <HStack w="100%" justifyContent="space-between">
          <Text fontWeight="normal" fontSize="sm" color="gray.700">
            {language.enName}
          </Text>
          {!fullySupported(language) && (
            <Tooltip
              p={3}
              label={
                <Stack>
                  <Text fontWeight="bold">
                    <FormattedMessage id="language-toast-title" />
                  </Text>
                  <SupportStatement language={language} intl={intl} />
                </Stack>
              }
              hasArrow
              placement="top-start"
              isOpen={tooltipOpen}
              ref={tooltipRef}
            >
              <Text
                as="span"
                onMouseEnter={() => setTooltipOpen(true)}
                onMouseLeave={() => setTooltipOpen(false)}
                onClick={handleTooltipClick}
              >
                <RiErrorWarningLine fill="#A0AEC0" />
              </Text>
            </Tooltip>
          )}
        </HStack>
      </VStack>
    </Button>
  );
};

const uiSupported = (language: Language): boolean =>
  language.ui === true ||
  (language.ui === "preview" && flags.translationPreview);

const fullySupported = (language: Language): boolean => {
  return uiSupported(language) === true && language.makeCode;
};

interface SupportStatementProps extends BoxProps {
  language: Language;
  intl: IntlShape;
}

const SupportStatement = ({
  language,
  intl,
  ...rest
}: SupportStatementProps) => {
  return (
    <Text {...rest}>
      <Text as="div" pb={1}>
        {intl.formatMessage({ id: "language-supported-for" })}
      </Text>
      <List>
        <SupportedListItem supported={language.makeCode} intl={intl}>
          Microsoft MakeCode
        </SupportedListItem>
        <SupportedListItem supported={uiSupported(language)} intl={intl}>
          micro:bit CreateAI
        </SupportedListItem>
      </List>
    </Text>
  );
};

const SupportedListItem = ({
  children,
  supported,
  intl,
}: {
  children: string;
  supported: boolean;
  intl: IntlShape;
}) => {
  return (
    <ListItem>
      <Icon
        fontSize="1.2em"
        verticalAlign="middle"
        as={supported ? RiCheckboxLine : RiCheckboxBlankLine}
        aria-label={intl.formatMessage({
          id: supported
            ? "language-support-checked"
            : "language-support-unchecked",
        })}
      />{" "}
      {children}
    </ListItem>
  );
};
