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
});

export default defaultDeploymentFactory;
