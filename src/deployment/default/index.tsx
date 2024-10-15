/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { BoxProps, Text, VStack } from "@chakra-ui/react";
import { ReactNode, createContext } from "react";
import { CookieConsent, DeploymentConfigFactory } from "..";
import { NullLogging } from "./logging";
import theme from "./theme";

const stubConsentValue: CookieConsent = {
  analytics: false,
  functional: true,
};
const stubConsentContext = createContext<CookieConsent | undefined>(
  stubConsentValue
);

const defaultDeploymentFactory: DeploymentConfigFactory = () => ({
  chakraTheme: theme,
  appNameFull: "ml-trainer",
  appNameShort: "ml-trainer",
  AppLogo: (props: BoxProps) => {
    return (
      <VStack
        color="white"
        fontWeight="bold"
        justifyContent="center"
        alignItems="center"
        {...props}
      >
        <Text>ml-trainer</Text>
      </VStack>
    );
  },
  OrgLogo: undefined,
  logging: new NullLogging(),
  compliance: {
    ConsentProvider: ({ children }: { children: ReactNode }) => (
      <stubConsentContext.Provider value={stubConsentValue}>
        {children}
      </stubConsentContext.Provider>
    ),
    consentContext: stubConsentContext,
    manageCookies: undefined,
  },
  supportLinks: {
    // Just placeholders, these need replacing in a real deployment with branded help content.
    bluetooth: "https://support.microbit.org",
    main: "https://support.microbit.org",
    troubleshooting: "https://support.microbit.org",
    wearable: "https://support.microbit.org",
  },
  // TODO: To remove from default theme
  activitiesBaseUrl:
    "http://open-in-createai.next-review.microbit.org.s3-website-eu-west-1.amazonaws.com/classroom/activities",
});

export default defaultDeploymentFactory;
