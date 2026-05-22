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
class NoOpBroadcastChannel {
  constructor() {}
  postMessage(_data: unknown) {}
  addEventListener(_type: string, _handler: (e: MessageEvent) => void) {}
  removeEventListener(_type: string, _handler: (e: MessageEvent) => void) {}
  close() {}
}

// Used to keep project state synced between open tabs / windows.
// Broadcast channel is not supported for older browsers/iOS versions, so a
// no-op version is used to avoid throwing an error.
// TODO: Revisit making project state syncing work for older web browsers.
export const broadcastChannel =
  typeof BroadcastChannel === "undefined"
    ? new NoOpBroadcastChannel()
    : new BroadcastChannel("ml");
