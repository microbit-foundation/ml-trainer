/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { BoxProps } from "@chakra-ui/react";
import React, { ComponentType, ReactNode, useContext } from "react";
import { createNativeCompliance } from "../compliance/native";
import { createWebCompliance } from "../compliance/web";
import { flags } from "../flags";
import { Logger } from "../logging/logger";
import { Logging } from "../logging/logging";
import { NativeSink, WebSink } from "../logging/sink";
import { ConsoleLogging } from "./default/logging";

// This is configured via a vite alias, defaulting to ./default
import { default as df } from "theme-package";

/**
 * Brand-and-content config supplied by the (optionally private) theme
 * package. No analytics opinions live here — the OSS deployment loader
 * picks the logger and compliance backend based on build mode and env.
 */
export interface BrandConfig {
  appNameShort: string;
  appNameFull: string;
  /**
   * Stable analytics identifier slug for this product. Attached as
   * the `product` param on every event the logger emits, so dashboards
   * can split traffic by product when multiple sibling apps share a
   * GA4 property.
   */
  product: string;
  /**
   * Read by vite.config.ts at build time for HTML meta tags. Not used at
   * runtime.
   */
  metaDescription?: string;
  /**
   * Read by vite.config.ts at build time for HTML meta tags. Not used at
   * runtime.
   */
  ogDescription?: string;
  AppLogo: ComponentType<BoxProps>;
  OrgLogo?: ComponentType<BoxProps>;
  welcomeVideoYouTubeId?: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chakraTheme: any;

  supportLinks: {
    main: string;
    troubleshooting: string;
    bluetooth: string;
    wearable: string;
  };

  accessibilityLink?: string;
  termsOfUseLink?: string;
  privacyPolicyLink?: string;
  activitiesBaseUrl?: string;
  translationLink?: string;
}

export type BrandConfigFactory = (env: Record<string, string>) => BrandConfig;

export interface CookieConsent {
  analytics: boolean;
  functional: boolean;
}

export interface DeploymentConfig extends BrandConfig {
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
  logging: Logging;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const brandFactory: BrandConfigFactory = df;

const isAppsBuild = import.meta.env.VITE_BUILD_MODE === "apps";
// True only when the native Firebase config files are in place.
// Without them the Logger's NativeSink would crash iOS at
// `FirebaseApp.configure()`, so a fresh OSS clone falls back to
// `ConsoleLogging`. The flag is set automatically in vite.config.ts
// when the plist + google-services.json are present.
const hasFirebaseConfig = import.meta.env.VITE_HAS_FIREBASE_CONFIG === "true";

const createLogging = (
  env: Record<string, string>,
  product: string
): Logging => {
  if (isAppsBuild) {
    return hasFirebaseConfig
      ? new Logger(new NativeSink(), env, product)
      : new ConsoleLogging();
  }
  return new Logger(new WebSink(), env, product);
};

const createCompliance = (
  env: Record<string, string>
): DeploymentConfig["compliance"] => {
  if (isAppsBuild) {
    return createNativeCompliance();
  }
  return createWebCompliance(env);
};

export const deployment: DeploymentConfig = (() => {
  const env = import.meta.env as unknown as Record<string, string>;
  const brand = brandFactory(env);
  const composed: DeploymentConfig = {
    ...brand,
    logging: createLogging(env, brand.product),
    compliance: createCompliance(env),
  };
  if (import.meta.env.DEV || flags.e2e) {
    return {
      ...composed,
      // Sidestep CORS issues in development/e2e. See vite.config.ts.
      activitiesBaseUrl: "/microbit-org-proxy/classroom/activities/",
    };
  }
  return composed;
})();

export const useDeployment = (): DeploymentConfig => deployment;

export const useCookieConsent = (): CookieConsent | undefined => {
  const { compliance } = useDeployment();
  return useContext(compliance.consentContext);
};
