import { useEffect } from "react";
import { useNavigate } from "react-router";
import { createDataSamplesPageUrl } from "../urls";
import { useStore } from "../store";

const EditorPage = () => {
  const navigate = useNavigate();
  const model = useStore((s) => s.model);
  const setEditorOpen = useStore((s) => s.setEditorOpen);

  useEffect(() => {
    if (!model) {
      navigate(createDataSamplesPageUrl());
    } else {
      setEditorOpen(true);
    }

    return () => {
      if (model) {
        setEditorOpen(false);
      }
    };
  }, [model, navigate, setEditorOpen]);
  return <></>;
};

export default EditorPage;
