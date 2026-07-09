/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { FormattedMessage } from "react-intl";
import { button } from "styled-system/recipes";
import bannerBackground from "theme-package/images/banner-background.svg";
import { useDeployment } from "../deployment";
import { css, cx, Heading, HStack, Text, VStack } from "../shared-ui";
import { useSettings } from "../store";
import { learnMoreUrl } from "../utils/external-links";

// For landscape mobile screen sizes. Deliberately tighter than the shared
// _shortHeight condition (800px).
const bannerShortHeight = "@media (max-height: 700px)";

const HomepageBanner = () => {
  const { appNameShort } = useDeployment();
  const [settings] = useSettings();
  return (
    <HStack w="100%">
      <HStack
        w="100%"
        mx={{ base: 3, md: 5 }}
        mt={5}
        borderRadius="5px"
        justifyContent="center"
        bg="brand.500"
        backgroundSize="cover"
        backgroundPosition="center"
        height={{ base: "200px", sm: "230px", "2xl": "300px" }}
        css={{
          [bannerShortHeight]: { height: "150px", backgroundSize: "auto 140%" },
        }}
        style={{ backgroundImage: `url(${bannerBackground})` }}
      >
        <VStack
          pt={5}
          pb={5}
          color="white"
          textAlign="center"
          gap={{ base: 3, md: 4, "2xl": 5 }}
          css={{ [bannerShortHeight]: { gap: 3 } }}
        >
          <VStack gap={{ base: 1, md: 2 }}>
            <Heading
              fontSize={{ base: "2xl", sm: "3xl" }}
              css={{ [bannerShortHeight]: { fontSize: "2xl" } }}
            >
              <FormattedMessage
                id="homepage-banner-heading"
                values={{ appName: appNameShort }}
              />
            </Heading>
            <Text
              fontSize={{ base: "md", sm: "lg" }}
              css={{ [bannerShortHeight]: { fontSize: "md" } }}
              pr={5}
              pl={5}
            >
              <FormattedMessage id="homepage-banner-subtitle" />
            </Text>
          </VStack>
          <a
            href={learnMoreUrl(settings.languageId)}
            className={cx(
              button({}),
              css({
                bg: "white",
                border: 0,
                color: "brand.700",
                _hover: { textDecoration: "none" },
                _focusVisible: {
                  boxShadow:
                    "0 0 0 2px token(colors.brand.600), 0 0 0 6px rgba(255, 255, 255, 0.8)",
                  outline: "none",
                },
              })
            )}
          >
            <FormattedMessage id="learn-more-action" />
          </a>
        </VStack>
      </HStack>
    </HStack>
  );
};

export default HomepageBanner;
