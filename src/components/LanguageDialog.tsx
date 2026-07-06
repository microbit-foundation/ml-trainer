/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useCallback } from "react";
import {
  RiCheckboxBlankLine,
  RiCheckboxLine,
  RiErrorWarningLine,
  RiExternalLinkLine,
} from "react-icons/ri";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { deployment, useDeployment } from "../deployment";
import { flags } from "../flags";
import { isNativePlatform } from "../platform";
import { allLanguages, Language, nativeLanguageIds } from "../settings";
import {
  Box,
  Button,
  Grid,
  HStack,
  Icon,
  Link,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  SystemStyleObject,
  Text,
  Tooltip,
  useToast,
  VStack,
} from "../shared-ui";
import { useStore } from "../store";
import ModalFooterContent from "./ModalFooterContent";

interface LanguageDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Language setting dialog.
 */
export const LanguageDialog = ({ isOpen, onClose }: LanguageDialogProps) => {
  const setLanguage = useStore((s) => s.setLanguage);
  const handleChooseLanguage = useCallback(
    async (languageId: string) => {
      await setLanguage(languageId);
      onClose();
    },
    [onClose, setLanguage]
  );
  const fullySupportedLanguages = allLanguages.filter(fullySupported);
  const partiallySupportedLanguages = allLanguages.filter(
    (l) => !fullySupported(l)
  );
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "4xl" }}>
      <ModalHeader css={{ fontSize: "lg", fontWeight: "bold" }}>
        <FormattedMessage id="language" />
      </ModalHeader>
      <ModalBody>
        <VStack gap={3} width="100%">
          <Text
            as="h2"
            fontSize="md"
            fontWeight="bold"
            textAlign="left"
            width="100%"
          >
            <FormattedMessage id="language-fully-supported-heading" />
          </Text>
          <Grid width="100%" columns={{ base: 1, sm: 2, md: 3 }} gap={4}>
            {fullySupportedLanguages.map((language) => (
              <LanguageCard
                key={language.id}
                language={language}
                onChooseLanguage={handleChooseLanguage}
              />
            ))}
          </Grid>
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
          <Grid width="100%" columns={{ base: 1, sm: 2, md: 3 }} gap={4}>
            {partiallySupportedLanguages.map((language) => (
              <LanguageCard
                key={language.id}
                language={language}
                onChooseLanguage={handleChooseLanguage}
              />
            ))}
          </Grid>
        </VStack>
      </ModalBody>
      <ModalFooter>
        <ModalFooterContent
          leftContent={
            <Link
              pl={1}
              href={deployment.translationLink}
              target="_blank"
              rel="noopener"
              color="brand.500"
            >
              <FormattedMessage id="help-translate" />{" "}
              <Icon as={RiExternalLinkLine} />
            </Link>
          }
        >
          <Button variant="primary" onPress={onClose}>
            <FormattedMessage id="close-action" />
          </Button>
        </ModalFooterContent>
      </ModalFooter>
    </Modal>
  );
};

interface LanguageCardProps {
  language: Language;
  onChooseLanguage: (languageId: string) => void;
}

const LanguageCard = ({ language, onChooseLanguage }: LanguageCardProps) => {
  const intl = useIntl();
  const toast = useToast();
  const supported = fullySupported(language);
  const handleSelect = useCallback(() => {
    onChooseLanguage(language.id);
    if (!fullySupported(language)) {
      toast({
        title: intl.formatMessage({ id: "language-toast-title" }),
        description: <SupportStatement language={language} intl={intl} />,
        status: "info",
        duration: 5_000,
        isClosable: true,
      });
    }
  }, [intl, language, onChooseLanguage, toast]);

  // The selection button covers the whole card; the visible content sits above
  // it, and the warning tooltip trigger is a sibling. react-aria-components
  // disallows nesting a focusable tooltip trigger inside a button, so we use
  // this overlay pattern to keep the tooltip anchored on the warning icon.
  return (
    <Box position="relative" w="100%">
      <Button
        variant="language"
        aria-label={language.name}
        onPress={handleSelect}
        data-testid={language.id}
        css={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          borderRadius: "xl",
        }}
      />
      <VStack
        alignItems="flex-start"
        w="100%"
        css={{ position: "relative", pointerEvents: "none", py: 4, px: 5 }}
      >
        <Text fontSize="xl" fontWeight="semibold" color="languageText">
          {language.name}
        </Text>
        <HStack w="100%" justifyContent="space-between">
          <Text fontWeight="normal" fontSize="sm" color="gray.700">
            {language.enName}
          </Text>
          {!supported && (
            <Tooltip
              hasArrow
              placement="top"
              css={{ px: 3, py: 3 }}
              content={
                <Stack>
                  <Text fontWeight="bold">
                    <FormattedMessage id="language-toast-title" />
                  </Text>
                  <SupportStatement language={language} intl={intl} />
                </Stack>
              }
            >
              <Button
                variant="unstyled"
                aria-label={intl.formatMessage({ id: "language-toast-title" })}
                css={{
                  pointerEvents: "auto",
                  color: "gray.400",
                  cursor: "default",
                  // Shrink tightly to the icon: fixes partial-card height (the
                  // default md size would force h10) and makes the focus ring an
                  // even square around the glyph rather than a tall rectangle.
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: "1",
                  height: "auto",
                  minHeight: "0",
                  minWidth: "0",
                  padding: "0",
                  borderRadius: "base",
                }}
              >
                <Icon as={RiErrorWarningLine} />
              </Button>
            </Tooltip>
          )}
        </HStack>
      </VStack>
    </Box>
  );
};

const uiSupported = (language: Language): boolean => {
  if (isNativePlatform() && !nativeLanguageIds.includes(language.id)) {
    return false;
  }
  return (
    language.ui === true ||
    (language.ui === "preview" && flags.translationPreview)
  );
};

const fullySupported = (language: Language): boolean => {
  return uiSupported(language) === true && language.makeCode;
};

interface SupportStatementProps {
  language: Language;
  intl: IntlShape;
  css?: SystemStyleObject;
}

const SupportStatement = ({ language, intl, css }: SupportStatementProps) => {
  const { appNameFull } = useDeployment();
  return (
    <Text css={css}>
      <Text as="div" pb={1}>
        {intl.formatMessage({ id: "language-supported-for" })}
      </Text>
      <List>
        <SupportedListItem supported={language.makeCode} intl={intl}>
          Microsoft MakeCode
        </SupportedListItem>
        <SupportedListItem supported={uiSupported(language)} intl={intl}>
          {appNameFull}
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
        css={{ fontSize: "1.2em", verticalAlign: "middle" }}
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
