/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useEffect, useRef, useState } from "react";
import { Spinner, VStack } from "../shared-ui";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router";
import DownloadDialogs from "../components/DownloadDialogs";
import SaveDialogs from "../components/SaveDialogs";
import { useProject } from "../hooks/project-hooks";
import { useStore } from "../store";
import {
  createDataSamplesPageUrl,
  createHomePageUrl,
  createTestingModelPageUrl,
} from "../urls";
import Tour from "./Tour";
import { projectSessionStorage } from "../session-storage";

const CodePage = () => {
  const navigate = useNavigate();
  const model = useStore((s) => s.model);
  const setEditorOpen = useStore((s) => s.setEditorOpen);
  const isEditorOpen = useStore((s) => s.isEditorOpen);
  const { browserNavigationToEditor } = useProject();
  const [loading, setLoading] = useState<boolean>(true);
  const intl = useIntl();
  const initAsyncCalled = useRef(false);
  useEffect(() => {
    if (!projectSessionStorage.getProjectId()) {
      return navigate(createHomePageUrl());
    }
    if (!model) {
      return navigate(createDataSamplesPageUrl());
    }
    const initAsync = async () => {
      initAsyncCalled.current = true;
      const success = await browserNavigationToEditor();
      if (success) {
        setLoading(false);
        setEditorOpen(true);
      } else {
        navigate(createTestingModelPageUrl());
      }
    };

    if (!initAsyncCalled.current) {
      void initAsync();
    }

    return () => {
      setEditorOpen(false);
    };
  }, [browserNavigationToEditor, model, navigate, setEditorOpen]);

  // Redirects to the testing model page when MakeCode is closed by
  // MakeCode activity in another tab / window.
  useEffect(() => {
    if (!loading && !isEditorOpen) {
      navigate(createTestingModelPageUrl());
    }
  }, [isEditorOpen, loading, navigate]);

  return (
    <>
      {loading ? (
        <VStack h="100%" justifyContent="center">
          <Spinner
            aria-label={intl.formatMessage({ id: "loading" })}
            speed="2s"
            css={{
              width: "166px",
              height: "166px",
              borderWidth: "16px",
              color: "brand.600",
              borderBottomColor: "whitesmoke",
              borderLeftColor: "whitesmoke",
            }}
          />
        </VStack>
      ) : (
        <>
          <Tour />
          <DownloadDialogs />
          <SaveDialogs />
        </>
      )}
    </>
  );
};

export default CodePage;
