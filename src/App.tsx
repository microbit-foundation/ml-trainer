/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ChakraProvider } from "@chakra-ui/react";
import { MakeCodeFrameDriver } from "@microbit/makecode-embed/react";
import React, { ReactNode, useMemo, useRef } from "react";
import {
  Outlet,
  RouterProvider,
  ScrollRestoration,
  createBrowserRouter,
} from "react-router-dom";
import { BufferedDataProvider } from "./buffered-data-hooks";
import EditCodeDialog from "./components/EditCodeDialog";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorHandlerErrorView from "./components/ErrorHandlerErrorView";
import NotFound from "./components/NotFound";
import ProjectDropTarget from "./components/ProjectDropTarget";
import { ConnectProvider } from "./connect-actions-hooks";
import { ConnectStatusProvider } from "./connect-status-hooks";
import { ConnectionStageProvider } from "./connection-stage-hooks";
import { deployment, useDeployment } from "./deployment";
import { ProjectProvider } from "./hooks/project-hooks";
import { LoggingProvider } from "./logging/logging-hooks";
import TranslationProvider from "./messages/TranslationProvider";
import { resourcesConfig, sessionPageConfigs } from "./pages-config";
import HomePage from "./pages/HomePage";
import {
  createHomePageUrl,
  createResourcePageUrl,
  createSessionPageUrl,
} from "./urls";

export interface ProviderLayoutProps {
  children: ReactNode;
}

const logging = deployment.logging;

const Providers = ({ children }: ProviderLayoutProps) => {
  const deployment = useDeployment();
  const { ConsentProvider } = deployment.compliance;
  const driverRef = useRef<MakeCodeFrameDriver>(null);
  return (
    <React.StrictMode>
      <ChakraProvider theme={deployment.chakraTheme}>
        <LoggingProvider value={logging}>
          <ConsentProvider>
            <TranslationProvider>
              <ConnectStatusProvider>
                <ConnectProvider>
                  <BufferedDataProvider>
                    <ConnectionStageProvider>
                      <ProjectProvider driverRef={driverRef}>
                        <ProjectDropTarget>
                          <ErrorBoundary>
                            <EditCodeDialog ref={driverRef} />
                            {children}
                          </ErrorBoundary>
                        </ProjectDropTarget>
                      </ProjectProvider>
                    </ConnectionStageProvider>
                  </BufferedDataProvider>
                </ConnectProvider>
              </ConnectStatusProvider>
            </TranslationProvider>
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
        ...sessionPageConfigs.map((config) => {
          return {
            path: createSessionPageUrl(config.id),
            element: <config.pageElement />,
          };
        }),
        ...resourcesConfig.map((resource) => {
          return {
            path: createResourcePageUrl(resource.id),
            element: <resource.pageElement />,
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
