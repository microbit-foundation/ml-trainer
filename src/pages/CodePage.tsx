/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Spinner, VStack } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router";
import DownloadDialogs from "../components/DownloadDialogs";
import SaveDialogs from "../components/SaveDialogs";
import { useProject } from "../hooks/project-hooks";
import { useStore } from "../store";
import { createDataSamplesPageUrl, createTestingModelPageUrl } from "../urls";
import Tour from "./Tour";

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
    const initAsync = async () => {
      initAsyncCalled.current = true;
      if (!model) {
        navigate(createDataSamplesPageUrl());
      } else {
        const success = await browserNavigationToEditor();
        if (success) {
          setLoading(false);
          setEditorOpen(true);
        } else {
          navigate(createTestingModelPageUrl());
        }
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
            thickness="16px"
            speed="2s"
            emptyColor="whitesmoke"
            color="brand.600"
            h="166px"
            w="166px"
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
