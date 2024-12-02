// Shortcuts are global unless noted otherwise.
export const keyboardShortcuts = {
  // This is scoped by keyboard focus.
  addAction: ["ctrl+shift+enter", "meta+shift+enter"],
  saveSession: ["ctrl+shift+s", "meta+shift+s"],
  settings: ["ctrl+shift+p", "meta+shift+p"],
  nextAction: ["down"],
  previousAction: ["up"],
  renameAction: ["F2"],
};

export const globalShortcutConfig = {
  preventDefault: true,
  enableOnContentEditable: true,
  enableOnFormTags: true,
};
