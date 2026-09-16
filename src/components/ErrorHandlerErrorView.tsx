/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Button, Text, VStack } from "@microbit/ui";
import { ErrorPage, UnexpectedErrorPage } from "@microbit/ui-patterns";
import { useDeployment } from "../deployment";
import { isPublicFacingStage } from "../environment";

interface ErrorHandlerErrorViewProps {
  error?: unknown;
  /** The Sentry event id, when the error was reported. */
  reference?: string;
}

const isVersionError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "VersionError";

const ErrorHandlerErrorView = ({
  error,
  reference,
}: ErrorHandlerErrorViewProps) => {
  const { supportLinks } = useDeployment();
  if (error && isVersionError(error) && !isPublicFacingStage()) {
    return <StorageVersionErrorView />;
  }
  return (
    <UnexpectedErrorPage supportUrl={supportLinks.main} reference={reference} />
  );
};

const StorageVersionErrorView = () => {
  const handleClearAndReload = async () => {
    try {
      const dbs = await indexedDB.databases();
      await Promise.all(
        dbs
          .filter((db) => db.name)
          .map(
            (db) =>
              new Promise<void>((resolve, reject) => {
                const req = indexedDB.deleteDatabase(db.name!);
                req.onsuccess = () => resolve();
                req.onerror = () =>
                  reject(req.error ?? new Error("IndexedDB error"));
              })
          )
      );
    } catch {
      // Best effort
    }
    try {
      sessionStorage.clear();
    } catch {
      // Best effort
    }
    window.location.reload();
  };
  return (
    <ErrorPage title="Breaking change to stored data">
      <VStack gap={3}>
        <Text maxW="md" textAlign="center">
          The storage format has changed in this pre-release version and the old
          data format is not supported.
        </Text>
        <Button variant="primary" onPress={handleClearAndReload}>
          Clear data and reload
        </Button>
      </VStack>
    </ErrorPage>
  );
};

export default ErrorHandlerErrorView;
