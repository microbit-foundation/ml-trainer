import { Button, Heading, VStack, HStack, Text } from "@chakra-ui/react";
import bannerBackground from "theme-package/images/banner-background.svg";
import { useNavigate } from "react-router";
import { useCallback } from "react";
import { createAboutPageUrl } from "../urls";
import { FormattedMessage } from "react-intl";
import { useDeployment } from "../deployment";

const HomepageBanner = () => {
  const navigate = useNavigate();
  const { appNameShort } = useDeployment();

  const handleLearnMore = useCallback(() => {
    navigate(createAboutPageUrl());
  }, [navigate]);

  return (
    <HStack w="100%">
      <HStack
        w="100%"
        m={5}
        mb={0}
        rounded={5}
        justifyContent="center"
        backgroundColor="brand.600"
        backgroundImage={bannerBackground}
        backgroundSize="cover"
        backgroundPosition="center"
        height={{ base: 200, sm: 230, "2xl": 300 }}
      >
        <VStack
          pt={5}
          pb={5}
          textColor="white"
          textAlign="center"
          gap={{ base: 3, md: 4 }}
        >
          <VStack gap={{ base: 1, md: 2 }}>
            <Heading fontSize={{ base: "2xl", sm: "3xl" }}>
              <FormattedMessage
                id="homepage-banner-heading"
                values={{ appName: appNameShort }}
              />
            </Heading>
            <Text fontSize={{ base: "md", sm: "lg" }} pr={5} pl={5}>
              <FormattedMessage id="homepage-banner-subtitle" />
            </Text>
          </VStack>
          <Button
            backgroundColor="white"
            border={0}
            textColor="brand.700"
            onClick={handleLearnMore}
          >
            <FormattedMessage id="learn-more-action" />
          </Button>
        </VStack>
      </HStack>
    </HStack>
  );
};

export default HomepageBanner;
