import { HotkeyCallback, Keys, useHotkeys } from "react-hotkeys-hook";
import { useStore } from "./store";
import { Options } from "react-hotkeys-hook/dist/types";
import { useConnectionStage } from "./connection-stage-hooks";

// Shortcuts are global unless noted otherwise.
export const keyboardShortcuts = {
  // This is scoped by keyboard focus.
  addAction: ["ctrl+shift+enter", "meta+shift+enter"],
  saveSession: ["ctrl+shift+s", "meta+shift+s"],
  settings: ["ctrl+shift+p", "meta+shift+p"],
  focusBelowAction: ["down"],
  focusAboveAction: ["up"],
  renameAction: ["F2"],
  connect: ["ctrl+shift+u", "meta+shift+u"],
  disconnect: ["ctrl+shift+k", "meta+shift+k"],
  editInMakeCode: ["ctrl+shift+e", "meta+shift+e"],
};

const globalShortcutConfig = {
  preventDefault: true,
  enableOnContentEditable: true,
  enableOnFormTags: true,
};

export const useShortcut = (
  keys: Keys,
  hotkeyCallback: HotkeyCallback,
  options: Options = {}
) => {
  const isNonConnectionDialogOpen = useStore((s) =>
    s.isNonConnectionDialogOpen()
  );
  const { isDialogOpen: isConnectionDialogOpen } = useConnectionStage();
  return useHotkeys(keys, hotkeyCallback, {
    ...globalShortcutConfig,
    ...options,
    enabled:
      (options.enabled ?? true) &&
      !isConnectionDialogOpen &&
      !isNonConnectionDialogOpen,
  });
};
