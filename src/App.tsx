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
  Navigate,
  Outlet,
  RouterProvider,
  ScrollRestoration,
  useLocation,
  useNavigate,
  useRouteError,
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
  loadSettingsFromStorage,
  StorageErrorEvent,
  useStore,
} from "./store";
import {
  createCodePageUrl,
  createDataSamplesPageUrl,
  createHomePageUrl,
  createImportPageUrl,
  createOpenSharedProjectPageUrl,
  createProjectsPageUrl,
  createTestingModelPageUrl,
} from "./urls";
import ProjectsPage from "./pages/ProjectsPage";
import HomePage from "./pages/HomePage";

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

  const storageError: StorageErrorEvent | undefined = useStore(
    (s) => s.storageError
  );
  useEffect(() => {
    if (!storageError) {
      return;
    }
    const messages =
      storageError.type === "quota"
        ? {
            title: intl.formatMessage({ id: "storage-error-quota-title" }),
            description: intl.formatMessage({
              id: "storage-error-quota-description",
            }),
          }
        : {
            title: intl.formatMessage({ id: "storage-error-other" }),
          };
    const toastOptions = {
      id: "storage-error",
      position: "top" as const,
      duration: null,
      isClosable: true,
      variant: "toast",
      status: "error" as const,
      ...messages,
    };
    if (toast.isActive("storage-error")) {
      toast.update("storage-error", toastOptions);
    } else {
      toast(toastOptions);
    }
  }, [intl, storageError, toast]);

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
      if (id && data.projectIds.includes(id)) {
        switch (data.messageType) {
          case BroadcastChannelMessageType.RELOAD_PROJECT: {
            await loadProjectAndModelFromStorage(id);
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
      } else if (data.settings) {
        await loadSettingsFromStorage();
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

// Guard ensures we only load from storage once per page lifecycle (on
// refresh/deeplink). Subsequent in-app navigations populate the store
// directly via loadProjectAndModelFromStorage calls in HomePage/ProjectsPage.
let loaderFuncCalled = false;
const commonLoaderFunction = async () => {
  if (!loaderFuncCalled) {
    loaderFuncCalled = true;
    const projectId = projectSessionStorage.getProjectId();
    if (projectId) {
      await loadProjectAndModelFromStorage(projectId);
    }
  }
  return null;
};

const RouteErrorView = () => {
  const error = useRouteError();
  return <ErrorHandlerErrorView error={error} />;
};

const createRouter = () => {
  return createBrowserRouter([
    {
      id: "root",
      path: "",
      loader: async () => {
        await loadSettingsFromStorage();
        return null;
      },
      element: <Layout />,
      // This one gets used for loader errors (typically offline)
      // We set an error boundary inside the routes too that logs render-time errors.
      // ErrorBoundary doesn't work properly in the loader case at least.
      errorElement: <RouteErrorView />,
      children: [
        {
          path: createHomePageUrl(),
          element: <HomePage />,
          loader: () => getAllProjectsFromStorage(),
        },
        {
          path: createProjectsPageUrl(),
          element: <ProjectsPage />,
          loader: () => getAllProjectsFromStorage(),
        },
        { path: createImportPageUrl(), element: <ImportPage /> },
        {
          path: createDataSamplesPageUrl(),
          element: <DataSamplesPage />,
          loader: () => commonLoaderFunction(),
        },
        {
          path: createTestingModelPageUrl(),
          element: <TestingModelPage />,
          loader: commonLoaderFunction,
        },
        {
          path: createCodePageUrl(),
          element: <CodePage />,
          loader: commonLoaderFunction,
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
          path: "/new",
          element: <Navigate to={createHomePageUrl()} replace />,
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
