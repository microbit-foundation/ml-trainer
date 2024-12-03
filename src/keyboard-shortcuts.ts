// Shortcuts are global unless noted otherwise.
export const keyboardShortcuts = {
  // This is scoped by keyboard focus.
  addAction: ["ctrl+shift+enter", "meta+shift+enter"],
  saveSession: ["ctrl+shift+s", "meta+shift+s"],
  nextAction: ["down"],
  previousAction: ["up"],
  renameAction: ["F2"],
  connect: ["ctrl+shift+c", "meta+shift+c"],
  disconnect: ["ctrl+shift+d", "meta+shift+d"],
  editInMakeCode: ["ctrl+shift+e", "meta+shift+e"],
};

export const globalShortcutConfig = {
  preventDefault: true,
  enableOnContentEditable: true,
  enableOnFormTags: true,
};
