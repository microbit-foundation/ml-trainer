/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { MakeCodeFrameDriver } from "@microbit/makecode-embed/react";
import { createBluetoothConnection } from "@microbit/microbit-connection/bluetooth";
import { createRadioBridgeConnection } from "@microbit/microbit-connection/radio-bridge";
import { createUSBConnection } from "@microbit/microbit-connection/usb";
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
import { Capacitor } from "@capacitor/core";
import "theme-package/fonts/fonts.css";
import { setActiveMenuClose, useNativeBackButton } from "./back-button";
import {
  broadcastChannel,
  BroadcastChannelData,
  BroadcastChannelMessageType,
} from "./broadcast-channel";
import { BufferedDataProvider } from "./buffered-data-hooks";
import EditCodeDialog from "./components/EditCodeDialog";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorHandlerErrorView from "./components/ErrorHandlerErrorView";
import LoadingOverlay from "./components/LoadingOverlay";
import NotFound from "./components/NotFound";
import { SharedUIProvider, ToastProvider, useToast } from "./shared-ui";
import { ConnectionsProvider } from "./connections-hooks";
import { DataConnectionEventProvider } from "./data-connection-flow";
import { useDeepLinks } from "./deep-links-hook";
import { deployment, useDeployment } from "./deployment";
import { MockBluetoothConnection } from "./device/mockBluetooth";
import { MockRadioBridgeConnection } from "./device/mockRadioBridge";
import { MockUSBConnection } from "./device/mockUsb";
import { flags } from "./flags";
import { ProjectProvider } from "./hooks/project-hooks";
import { useSafeAreaInsets } from "./hooks/use-safe-area-insets";
import { LoggingProvider } from "./logging/logging-hooks";
import { hasMakeCodeMlExtension } from "./makecode/utils";
import TranslationProvider from "./messages/TranslationProvider";
import { PostImportDialogState } from "./model";
import CodePage from "./pages/CodePage";
import DataSamplesPage from "./pages/DataSamplesPage";
import HomePage from "./pages/HomePage";
import ImportPage from "./pages/ImportPage";
import OpenSharedProjectPage from "./pages/OpenSharedProjectPage";
import ProjectsPage from "./pages/ProjectsPage";
import TestingModelPage from "./pages/TestingModelPage";
import { isNativePlatform } from "./platform";
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
  createLegacyNewPageUrl,
  createOpenSharedProjectPageUrl,
  createProjectsPageUrl,
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
  ? new MockUSBConnection()
  : createUSBConnection({ logging });
const bluetooth = isMockDeviceMode()
  ? new MockBluetoothConnection()
  : createBluetoothConnection({
      logging,
      deviceBondState: useStore.getState().deviceBondState,
    });
const radioBridge = isMockDeviceMode()
  ? new MockRadioBridgeConnection(usb)
  : createRadioBridgeConnection(usb, { logging });

/**
 * shared-ui's installation point: localized strings from the app catalogue,
 * and — on native platforms — the registry the Android back button handler
 * uses to close an open menu. Lives inside TranslationProvider so the strings
 * re-resolve on locale change.
 */
const SharedUIConfig = ({ children }: ProviderLayoutProps) => {
  const intl = useIntl();
  const strings = useMemo(
    () => ({ close: intl.formatMessage({ id: "close-action" }) }),
    [intl]
  );
  return (
    <SharedUIProvider
      strings={strings}
      overlayCloseRegistrar={
        Capacitor.isNativePlatform() ? setActiveMenuClose : undefined
      }
    >
      {children}
    </SharedUIProvider>
  );
};

const Providers = ({ children }: ProviderLayoutProps) => {
  const deployment = useDeployment();
  const { ConsentProvider } = deployment.compliance;
  return (
    <React.StrictMode>
      <LoggingProvider value={logging}>
        <TranslationProvider>
          <SharedUIConfig>
            <ToastProvider />
            <ConsentProvider>
              <ConnectionsProvider {...{ usb, bluetooth, radioBridge }}>
                <DataConnectionEventProvider>
                  <BufferedDataProvider>{children}</BufferedDataProvider>
                </DataConnectionEventProvider>
              </ConnectionsProvider>
            </ConsentProvider>
          </SharedUIConfig>
        </TranslationProvider>
      </LoggingProvider>
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

  // Emit one navigate event per pathname change, including on initial
  // mount. `location.pathname` excludes query and fragment, so this
  // matches what GA4 Enhanced Measurement collects as `page_path` on
  // web — the Pages-and-screens report aligns without extra work.
  useEffect(() => {
    logging.navigate({ path: location.pathname });
  }, [location.pathname]);

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
    const messages = (() => {
      if (storageError.type === "quota") {
        return {
          title: intl.formatMessage({ id: "storage-error-quota-title" }),
          description: intl.formatMessage({
            id: "storage-error-quota-description",
          }),
        };
      }
      if (storageError.kind === "device") {
        return {
          title: intl.formatMessage({
            id: "storage-error-device-other",
          }),
        };
      }
      return {
        title: intl.formatMessage({ id: "storage-error-other" }),
      };
    })();
    const toastOptions = {
      id: "storage-error",
      duration: null,
      isClosable: true,
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

  // Native back button / swipe-back handling (no-op on desktop).
  useNativeBackButton();

  // Native deep link (Universal Link / App Link) handling (no-op on desktop).
  useDeepLinks();

  const isLoadingOverlayVisible = useStore((s) => s.isLoadingOverlayVisible);
  return (
    // We use this even though we have errorElement as this does logging.
    <ErrorBoundary>
      <ScrollRestoration />
      <ProjectProvider driverRef={driverRef}>
        <EditCodeDialog ref={driverRef} />
        <LoadingOverlay loading={isLoadingOverlayVisible} />
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
          path: createLegacyNewPageUrl(),
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
  // Detect safe area insets and set CSS variables for nav bar side only
  useSafeAreaInsets();

  useEffect(() => {
    // Capability flags are user-scoped GA4 dimensions on the web build —
    // they describe the browser's WebUSB / WebBluetooth API surface, not
    // anything Capacitor knows about. On native builds connectivity goes
    // through native plugins and these properties would be misleading.
    if (!isNativePlatform()) {
      logging.setUserProperty(
        "webusb_available",
        "usb" in navigator ? "yes" : "no"
      );
      if (navigator.bluetooth) {
        navigator.bluetooth
          .getAvailability()
          .then((bluetoothAvailable) => {
            logging.setUserProperty(
              "webbluetooth_available",
              bluetoothAvailable ? "yes" : "no"
            );
          })
          .catch((err) => {
            logging.error("Error checking BT availability", err);
          });
      } else {
        logging.setUserProperty("webbluetooth_available", "no");
      }
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
