const editorVersionOverrideSessionStorageKey = "editorVersionOverride";
export const setEditorVersionOverride = (version: string | undefined) => {
  if (version) {
    sessionStorage.setItem(editorVersionOverrideSessionStorageKey, version);
  } else {
    sessionStorage.removeItem(editorVersionOverrideSessionStorageKey);
  }
};
export const getEditorVersionOverride = (): string | undefined => {
  return (
    sessionStorage.getItem(editorVersionOverrideSessionStorageKey) ?? undefined
  );
};
