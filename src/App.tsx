/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ChakraProvider, useToast } from "@chakra-ui/react";
import { MakeCodeFrameDriver } from "@microbit/makecode-embed/react";
import React, { ReactNode, useEffect, useMemo, useRef } from "react";
import { useIntl } from "react-intl";
import {
  Outlet,
  RouterProvider,
  ScrollRestoration,
  createBrowserRouter,
  useNavigate,
} from "react-router-dom";
import { BufferedDataProvider } from "./buffered-data-hooks";
import EditCodeDialog from "./components/EditCodeDialog";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorHandlerErrorView from "./components/ErrorHandlerErrorView";
import NotFound from "./components/NotFound";
import { ConnectProvider } from "./connect-actions-hooks";
import { ConnectStatusProvider } from "./connect-status-hooks";
import { ConnectionStageProvider } from "./connection-stage-hooks";
import { deployment, useDeployment } from "./deployment";
import { ProjectProvider } from "./hooks/project-hooks";
import { LoggingProvider } from "./logging/logging-hooks";
import TranslationProvider from "./messages/TranslationProvider";
import CodePage from "./pages/CodePage";
import DataSamplesPage from "./pages/DataSamplesPage";
import HomePage from "./pages/HomePage";
import ImportPage from "./pages/ImportPage";
import NewPage from "./pages/NewPage";
import TestingModelPage from "./pages/TestingModelPage";
import { useStore } from "./store";
import {
  createCodePageUrl,
  createDataSamplesPageUrl,
  createHomePageUrl,
  createImportPageUrl,
  createNewPageUrl,
  createTestingModelPageUrl,
} from "./urls";
import { hasMakeCodeMlExtension } from "./makecode/utils";
import { PostImportDialogState } from "./model";

export interface ProviderLayoutProps {
  children: ReactNode;
}

const logging = deployment.logging;

const Providers = ({ children }: ProviderLayoutProps) => {
  const deployment = useDeployment();
  const { ConsentProvider } = deployment.compliance;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  deployment.chakraTheme.components.Button.variants = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ...deployment.chakraTheme.components.Button.variants,
    recordOutline: () => ({
      borderWidth: "1px",
      borderColor: "red.500",
      color: "red.700",
      bg: "transparent",
      _hover: {
        bg: "red.50",
      },
      _active: {
        bg: "red.100",
      },
    }),
    record: () => ({
      color: "white",
      bg: "red.500",
      _hover: {
        bg: "red.600",
        _disabled: {
          bg: "red.500",
        },
      },
      _active: {
        bg: "red.700",
      },
    }),
  };
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
                      {children}
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
  const driverRef = useRef<MakeCodeFrameDriver>(null);
  const setPostImportDialogState = useStore((s) => s.setPostImportDialogState);
  const navigate = useNavigate();
  const toast = useToast();
  const intl = useIntl();

  useEffect(() => {
    return useStore.subscribe(
      (
        { projectLoadTimestamp },
        { projectLoadTimestamp: prevProjectLoadTimestamp, getCurrentProject }
      ) => {
        if (projectLoadTimestamp > prevProjectLoadTimestamp) {
          // Side effects of loading a project, which MakeCode notifies us of.
          navigate(createDataSamplesPageUrl());
          toast({
            position: "top",
            duration: 5_000,
            title: intl.formatMessage({ id: "project-loaded" }),
            status: "info",
          });
          const project = getCurrentProject();
          if (!hasMakeCodeMlExtension(project)) {
            setPostImportDialogState(PostImportDialogState.NonCreateAiHex);
          }
        }
      }
    );
  }, [intl, navigate, setPostImportDialogState, toast]);

  return (
    // We use this even though we have errorElement as this does logging.
    <ErrorBoundary>
      <ScrollRestoration />
      <ProjectProvider driverRef={driverRef}>
        <EditCodeDialog ref={driverRef} />
        <Outlet />
      </ProjectProvider>
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
        {
          path: createNewPageUrl(),
          element: <NewPage />,
        },
        { path: createImportPageUrl(), element: <ImportPage /> },
        {
          path: createDataSamplesPageUrl(),
          element: <DataSamplesPage />,
        },
        {
          path: createTestingModelPageUrl(),
          element: <TestingModelPage />,
        },
        {
          path: createCodePageUrl(),
          element: <CodePage />,
        },
        {
          path: "*",
          element: <NotFound />,
        },
      ],
    },
  ]);
};

const App = () => {
  useEffect(() => {
    if (navigator.bluetooth) {
      navigator.bluetooth
        .getAvailability()
        .then((bluetoothAvailable) => {
          logging.event({
            type: "boot",
            detail: {
              bluetoothAvailable,
            },
          });
        })
        .catch((err) => {
          logging.error(err);
        });
    } else {
      logging.event({
        type: "boot",
        detail: {
          bluetoothAvailable: false,
        },
      });
    }
  }, []);
  const router = useMemo(createRouter, []);
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
};

export default App;
