/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ChakraProvider, useToast } from "@chakra-ui/react";
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
  defer,
  Outlet,
  RouterProvider,
  ScrollRestoration,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "theme-package/fonts/fonts.css";
import {
  broadcastChannel,
  BroadcastChannelData,
  BroadcastChannelMessageType,
} from "./broadcast-channel";
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
import ImportPage from "./pages/ImportPage";
import OpenSharedProjectPage from "./pages/OpenSharedProjectPage";
import TestingModelPage from "./pages/TestingModelPage";
import { projectSessionStorage } from "./session-storage";
import {
  getAllProjectsFromStorage,
  loadProjectAndModelFromStorage,
  useStore,
} from "./store";
import {
  createAboutPageUrl,
  createCodePageUrl,
  createDataSamplesPageUrl,
  createHomePageUrl,
  createImportPageUrl,
  createOpenSharedProjectPageUrl,
  createProjectsPageUrl,
  createTestingModelPageUrl,
} from "./urls";
import ProjectLoadWrapper from "./components/ProjectLoadWrapper";
import ProjectsPage from "./pages/ProjectsPage";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";

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
  const id = useStore((s) => s.id);
  const updateProjectTimestamp = useStore((s) => s.updateProjectUpdatedAt);
  const clearProjectState = useStore((s) => s.clearProjectState);
  const removeModel = useStore((s) => s.removeModel);
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const intl = useIntl();
  const updateProjectTimestampUrls = useMemo(() => {
    return [
      createDataSamplesPageUrl(),
      createTestingModelPageUrl(),
      createCodePageUrl(),
    ];
  }, []);

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

  useEffect(() => {
    if (updateProjectTimestampUrls.includes(location.pathname) && id) {
      void updateProjectTimestamp();
    }
  }, [id, location, updateProjectTimestamp, updateProjectTimestampUrls]);

  useEffect(() => {
    const listener = async (event: MessageEvent<BroadcastChannelData>) => {
      const data = event.data;
      // Only respond to broadcastChannel messages
      // from projects with the same id to keep tabs / windows in sync.
      if (data.projectId && data.projectId === id) {
        switch (data.messageType) {
          case BroadcastChannelMessageType.RELOAD_PROJECT: {
            await loadProjectAndModelFromStorage(data.projectId);
            break;
          }
          case BroadcastChannelMessageType.DELETE_PROJECT: {
            clearProjectState();
            if (updateProjectTimestampUrls.includes(location.pathname)) {
              navigate(createHomePageUrl());
            }
            break;
          }
          case BroadcastChannelMessageType.REMOVE_MODEL: {
            removeModel();
            break;
          }
        }
      }
      // Update all project data on the home page and projects page.
      if (
        location.pathname === createHomePageUrl() ||
        location.pathname === createProjectsPageUrl()
      ) {
        await getAllProjectsFromStorage();
      }
    };
    broadcastChannel.addEventListener("message", listener);
    return () => {
      broadcastChannel.removeEventListener("message", listener);
    };
  }, [
    clearProjectState,
    id,
    location.pathname,
    navigate,
    removeModel,
    updateProjectTimestampUrls,
  ]);

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

let loaderFuncCalled = false;
const commonLoaderFunction = () => {
  if (!loaderFuncCalled) {
    loaderFuncCalled = true;
    const projectId = projectSessionStorage.getProjectId();
    if (projectId) {
      const projectLoaded = loadProjectAndModelFromStorage(projectId);
      return defer({ projectLoaded });
    }
  }
  return { projectLoaded: true };
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
          loader: () => {
            const allProjectDataLoaded = getAllProjectsFromStorage();
            return defer({ allProjectDataLoaded });
          },
        },
        {
          path: createProjectsPageUrl(),
          element: <ProjectsPage />,
          loader: () => {
            const allProjectDataLoaded = getAllProjectsFromStorage();
            return defer({ allProjectDataLoaded });
          },
        },
        { path: createImportPageUrl(), element: <ImportPage /> },
        {
          path: createDataSamplesPageUrl(),
          element: (
            <ProjectLoadWrapper>
              <DataSamplesPage />
            </ProjectLoadWrapper>
          ),
          loader: () => commonLoaderFunction(),
        },
        {
          path: createTestingModelPageUrl(),
          element: (
            <ProjectLoadWrapper>
              <TestingModelPage />,
            </ProjectLoadWrapper>
          ),
          loader: commonLoaderFunction,
        },
        {
          path: createCodePageUrl(),
          element: (
            <ProjectLoadWrapper>
              <CodePage />,
            </ProjectLoadWrapper>
          ),
          loader: commonLoaderFunction,
        },
        {
          path: createAboutPageUrl(),
          element: <AboutPage />,
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
