export enum BroadcastChannelMessageType {
  RELOAD_PROJECT = "reload-project",
  DELETE_PROJECT = "delete-project",
  REMOVE_MODEL = "remove-model",
}

export interface BroadcastChannelData {
  messageType: BroadcastChannelMessageType;
  projectId?: string;
}

// Used to keep project state synced between open tabs / windows.
export const broadcastChannel = new BroadcastChannel("ml");
