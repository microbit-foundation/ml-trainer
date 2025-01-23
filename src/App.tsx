/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
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
import "theme-package/fonts/fonts.css";
import { MockWebUSBConnection } from "./device/mockUsb";
import {
  MicrobitRadioBridgeConnection,
  MicrobitWebBluetoothConnection,
  MicrobitWebUSBConnection,
} from "@microbit/microbit-connection";
import { MockWebBluetoothConnection } from "./device/mockBluetooth";
import { MockRadioBridgeConnection } from "./device/mockRadioBridge";

export interface ProviderLayoutProps {
  children: ReactNode;
}

const isMockDeviceMode = () => true;
// TODO: Use cookie mechanism for isMockDeviceMode.
// We use a cookie set from the e2e tests. Avoids having separate test and live builds.
// Boolean(
//   document.cookie.split("; ").find((row) => row.startsWith("mockDevice="))
// );

const logging = deployment.logging;

const usb = isMockDeviceMode()
  ? (new MockWebUSBConnection() as unknown as MicrobitWebUSBConnection)
  : new MicrobitWebUSBConnection({ logging });
const bluetooth = isMockDeviceMode()
  ? (new MockWebBluetoothConnection() as unknown as MicrobitWebBluetoothConnection)
  : new MicrobitWebBluetoothConnection({ logging });
const radioBridge = isMockDeviceMode()
  ? (new MockRadioBridgeConnection(
      usb
    ) as unknown as MicrobitWebBluetoothConnection)
  : new MicrobitRadioBridgeConnection(usb, { logging });

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
