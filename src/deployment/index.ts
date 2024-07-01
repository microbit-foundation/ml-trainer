/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode, useContext } from "react";
import { Logging } from "../logging/logging";

export type DeploymentConfigFactory = (
  env: Record<string, string>
) => DeploymentConfig;

// This is configured via a vite alias, defaulting to ./default
import { default as df } from "theme-package";
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const deploymentFactory: DeploymentConfigFactory = df;
export const deployment = deploymentFactory(import.meta.env);

export interface CookieConsent {
  analytics: boolean;
  functional: boolean;
}

export interface DeploymentConfig {
  welcomeVideoYouTubeId?: string;
  squareLogo?: ReactNode;
  horizontalLogo?: ReactNode;
  compliance: {
    /**
     * A provider that will be used to wrap the app UI.
     */
    ConsentProvider: (props: { children: ReactNode }) => JSX.Element;
    /**
     * Context that will be used to read the current consent value.
     * The provider is not used directly.
     */
    consentContext: React.Context<CookieConsent | undefined>;
    /**
     * Optional hook for the user to revisit cookie settings.
     */
    manageCookies: (() => void) | undefined;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chakraTheme: any;

  supportLink?: string;
  guideLink?: string;
  termsOfUseLink?: string;
  privacyPolicyLink?: string;
  translationLink?: string;

  logging: Logging;
}

export const useDeployment = (): DeploymentConfig => {
  return deployment;
};

export const useCookieConsent = (): CookieConsent | undefined => {
  const { compliance } = useDeployment();
  return useContext(compliance.consentContext);
};
