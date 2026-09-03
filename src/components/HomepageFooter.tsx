/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Button, HStack, Image, Link, Text, VStack } from "@microbit/ui";
import { FormattedMessage, useIntl } from "react-intl";
import { styled } from "styled-system/jsx";
import { useDeployment } from "../deployment";
// Optional images: undefined unless the branded theme package ships
// them, in which case the whole badge section is hidden. See vite-env.d.ts.
import appStoreBadge from "theme-package/images/optional/apple-app-store-badge.svg";
import googlePlayBadge from "theme-package/images/optional/google-play-store-badge.svg";
import { appStoreUrl, googlePlayUrl } from "../utils/external-links";
import { isNativePlatform } from "../platform";

const fontSize = { base: "sm", sm: "md" };

const HomepageFooter = () => {
  const intl = useIntl();
  const { copyrightHolder, privacyPolicyLink, termsOfUseLink, compliance } =
    useDeployment();
  const showAppBadges =
    !isNativePlatform() && !!appStoreBadge && !!googlePlayBadge;
  return (
    <styled.footer
      display="flex"
      flexDirection="column"
      alignItems="center"
      px={5}
      py={showAppBadges ? 8 : 5}
      mt={8}
      gap={5}
      bg="#e5e5e5"
    >
      {showAppBadges && (
        <VStack gap={3}>
          <Text fontSize={fontSize} textAlign="center">
            <FormattedMessage id="homepage-footer-title" />
          </Text>
          <HStack gap={4}>
            <Link
              href={appStoreUrl()}
              rel="noopener noreferrer"
              borderRadius="md"
            >
              <Image
                src={appStoreBadge}
                alt={intl.formatMessage({ id: "app-store-badge-alt" })}
                h={12}
              />
            </Link>
            <Link
              href={googlePlayUrl()}
              rel="noopener noreferrer"
              borderRadius="md"
            >
              <Image
                src={googlePlayBadge}
                alt={intl.formatMessage({ id: "google-play-badge-alt" })}
                h={12}
              />
            </Link>
          </HStack>
        </VStack>
      )}
      <HStack
        flexWrap="wrap"
        justifyContent="center"
        columnGap={5}
        rowGap={1}
        fontSize={fontSize}
      >
        {copyrightHolder && (
          <Text
            fontSize={fontSize}
            flexBasis={{ base: "100%", sm: "auto" }}
            textAlign="center"
          >
            © {copyrightHolder}
          </Text>
        )}
        {compliance.manageCookies && (
          <Button
            variant="link"
            css={{ color: "inherit", fontSize }}
            onPress={compliance.manageCookies}
          >
            <FormattedMessage id="cookies-action" />
          </Button>
        )}
        {privacyPolicyLink && (
          <Link
            variant="standalone"
            href={privacyPolicyLink}
            rel="noopener noreferrer"
          >
            <FormattedMessage id="privacy" />
          </Link>
        )}
        {termsOfUseLink && (
          <Link
            variant="standalone"
            href={termsOfUseLink}
            rel="noopener noreferrer"
          >
            <FormattedMessage id="terms" />
          </Link>
        )}
      </HStack>
    </styled.footer>
  );
};

export default HomepageFooter;
