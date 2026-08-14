export enum BroadcastChannelMessageType {
  RELOAD_PROJECT = "reload-project",
  DELETE_PROJECT = "delete-project",
  REMOVE_MODEL = "remove-model",
}

export interface BroadcastChannelData {
  messageType: BroadcastChannelMessageType;
  projectIds: string[];
  settings?: boolean;
}

// A no-op stand-in for browsers without BroadcastChannel (Safari <15.4).
// Extending EventTarget gives faithful addEventListener/removeEventListener
// behaviour for free; postMessage simply never reaches another tab.
class NoopBroadcastChannel extends EventTarget {
  constructor(readonly name: string) {
    super();
  }
  postMessage(_message: unknown): void {}
  close(): void {}
}

// Used to keep project state synced between open tabs / windows. Cross-tab
// sync is a nicety, so degrade to a no-op where BroadcastChannel is
// unavailable rather than crashing the app at load.
export const broadcastChannel: Pick<
  BroadcastChannel,
  "postMessage" | "addEventListener" | "removeEventListener" | "close"
> =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("ml")
    : new NoopBroadcastChannel("ml");
