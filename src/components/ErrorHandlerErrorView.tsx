/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Button, Text, VStack } from "@chakra-ui/react";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { isPublicFacingStage } from "../environment";
import ErrorPage from "./ErrorPage";
import Link from "./Link";

interface ErrorHandlerErrorViewProps {
  error?: unknown;
}

const isVersionError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "VersionError";

const ErrorHandlerErrorView = ({ error }: ErrorHandlerErrorViewProps) => {
  if (error && isVersionError(error) && !isPublicFacingStage()) {
    return <StorageVersionErrorView />;
  }
  return (
    <ErrorPage title="An unexpected error occurred">
      <VStack spacing={3}>
        <Text>
          <FormattedMessage
            id="support-request"
            values={{
              link: (chunks: ReactNode) => (
                <Link
                  color="brand.600"
                  textDecoration="underline"
                  href="https://support.microbit.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {chunks}
                </Link>
              ),
            }}
          />
        </Text>
        <Text>
          <Button variant="primary" onClick={() => window.location.reload()}>
            <FormattedMessage id="click-to-reload-page-action" />
          </Button>
        </Text>
      </VStack>
    </ErrorPage>
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
                req.onerror = () => reject(req.error);
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
      <VStack spacing={3}>
        <Text maxW="md" textAlign="center">
          The storage format has changed in this pre-release version and the old
          data format is not supported.
        </Text>
        <Button variant="primary" onClick={handleClearAndReload}>
          Clear data and reload
        </Button>
      </VStack>
    </ErrorPage>
  );
};

export default ErrorHandlerErrorView;
