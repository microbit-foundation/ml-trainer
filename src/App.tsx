/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ChakraProvider, useToast } from "@chakra-ui/react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { MakeCodeFrameDriver } from "@microbit/makecode-embed/react";
import {
  createRadioBridgeConnection,
  createWebBluetoothConnection,
  createWebUSBConnection,
} from "@microbit/microbit-connection";
import React, { ReactNode, useEffect, useMemo, useRef } from "react";
import { useIntl } from "react-intl";
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  ScrollRestoration,
  useNavigate,
} from "react-router-dom";
import "theme-package/fonts/fonts.css";
import { BufferedDataProvider } from "./buffered-data-hooks";
import EditCodeDialog from "./components/EditCodeDialog";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorHandlerErrorView from "./components/ErrorHandlerErrorView";
import NotFound from "./components/NotFound";
import { ConnectProvider } from "./connect-actions-hooks";
import { ConnectStatusProvider } from "./connect-status-hooks";
import { ConnectionStageProvider } from "./connection-stage-hooks";
import { deployment, useDeployment } from "./deployment";
import { MockWebBluetoothConnection } from "./device/mockBluetooth";
import { MockRadioBridgeConnection } from "./device/mockRadioBridge";
import { MockWebUSBConnection } from "./device/mockUsb";
import { flags } from "./flags";
import { ProjectProvider } from "./hooks/project-hooks";
import { LoggingProvider } from "./logging/logging-hooks";
import { hasMakeCodeMlExtension } from "./makecode/utils";
import TranslationProvider from "./messages/TranslationProvider";
import { PostImportDialogState } from "./model";
import CodePage from "./pages/CodePage";
import DataSamplesPage from "./pages/DataSamplesPage";
import HomePage from "./pages/HomePage";
import ImportPage from "./pages/ImportPage";
import NewPage from "./pages/NewPage";
import TestingModelPage from "./pages/TestingModelPage";
import OpenSharedProjectPage from "./pages/OpenSharedProjectPage";
import { useStore } from "./store";
import {
  createCodePageUrl,
  createDataSamplesPageUrl,
  createHomePageUrl,
  createImportPageUrl,
  createOpenSharedProjectPageUrl,
  createNewPageUrl,
  createTestingModelPageUrl,
} from "./urls";

export interface ProviderLayoutProps {
  children: ReactNode;
}

const isMockDeviceMode = () =>
  // We use a cookie set from the e2e tests. Avoids having separate test and live builds.
  Boolean(
    document.cookie.split("; ").find((row) => row.startsWith("mockDevice="))
  );

const logging = deployment.logging;

const usb = isMockDeviceMode()
  ? new MockWebUSBConnection()
  : createWebUSBConnection({ logging });
const bluetooth = isMockDeviceMode()
  ? new MockWebBluetoothConnection()
  : createWebBluetoothConnection({ logging });
const radioBridge = isMockDeviceMode()
  ? new MockRadioBridgeConnection(usb)
  : createRadioBridgeConnection(usb, { logging });

const Providers = ({ children }: ProviderLayoutProps) => {
  const deployment = useDeployment();
  const { ConsentProvider } = deployment.compliance;
  return (
    <React.StrictMode>
      <ChakraProvider theme={deployment.chakraTheme}>
        <LoggingProvider value={logging}>
          <ConsentProvider>
            <TranslationProvider>
              <ConnectStatusProvider>
                <ConnectProvider {...{ usb, bluetooth, radioBridge }}>
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
          path: createOpenSharedProjectPageUrl(),
          loader: ({ params }) => {
            if (
              !params.shareId ||
              !/^_[a-zA-Z\d]{12}$|^S(?:\d{5}-){3}\d{5}$/.test(params.shareId)
            ) {
              throw new Error("Not a valid shareId");
            }
            return null;
          },
          element: <OpenSharedProjectPage />,
          errorElement: <NotFound />,
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
    // Configure status bar for native platforms
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Light }).catch((err) => {
        logging.error(err);
      });
      StatusBar.setOverlaysWebView({ overlay: false }).catch((err) => {
        logging.error(err);
      });
    }

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
    const scriptId = "crowdin-jipt";
    if (
      document.getElementById("crowdin-jipt-config") &&
      flags.translate &&
      !document.getElementById(scriptId)
    ) {
      // Add Crowdin just in place translation script.
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "text/javascript";
      script.src = "//cdn.crowdin.com/jipt/jipt.js";
      document.head.appendChild(script);
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
