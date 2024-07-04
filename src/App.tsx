/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ChakraProvider } from "@chakra-ui/react";
import React, { ReactNode, useMemo } from "react";
import {
  Outlet,
  RouterProvider,
  ScrollRestoration,
  createBrowserRouter,
} from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorHandlerErrorView from "./components/ErrorHandlerErrorView";
import NotFound from "./components/NotFound";
import TranslationProvider from "./messages/TranslationProvider";
import SettingsProvider from "./settings";
import HomePage from "./pages/HomePage";
import { createHomePageUrl, createStepPageUrl } from "./urls";
import { deployment, useDeployment } from "./deployment";
import { stepsConfig } from "./steps-config";
import { LoggingProvider } from "./logging/logging-hooks";
import { ConnectionFlowProvider } from "./connections";

export interface ProviderLayoutProps {
  children: ReactNode;
}

// TODO: Use for logging provider
const logging = deployment.logging;

const Providers = ({ children }: ProviderLayoutProps) => {
  const deployment = useDeployment();
  const { ConsentProvider } = deployment.compliance;
  return (
    <React.StrictMode>
      <ChakraProvider theme={deployment.chakraTheme}>
        <LoggingProvider value={logging}>
          <ConsentProvider>
            <SettingsProvider>
              <ConnectionFlowProvider>
                <TranslationProvider>
                  <ErrorBoundary>{children}</ErrorBoundary>
                </TranslationProvider>
              </ConnectionFlowProvider>
            </SettingsProvider>
          </ConsentProvider>
        </LoggingProvider>
      </ChakraProvider>
    </React.StrictMode>
  );
};

const Layout = () => {
  return (
    // We use this even though we have errorElement as this does logging.
    <ErrorBoundary>
      <ScrollRestoration />
      <Outlet />
    </ErrorBoundary>
  );
};

const createRouter = () => {
  return createBrowserRouter([
    {
      id: "root",
      path: "",
      element: <Layout />,
      // This one gets used for loader errors (typically offline)
      // We set an error boundary inside the routes too that logs render-time errors.
      // ErrorBoundary doesn't work properly in the loader case at least.
      errorElement: <ErrorHandlerErrorView />,
      children: [
        {
          path: createHomePageUrl(),
          element: <HomePage />,
        },
        ...stepsConfig.map((step) => {
          return {
            path: createStepPageUrl(step.id),
            element: <step.pageElement />,
          };
        }),
        {
          path: "*",
          element: <NotFound />,
        },
      ],
    },
  ]);
};

const App = () => {
  const router = useMemo(createRouter, []);
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
};

export default App;
