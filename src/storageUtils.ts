import { ActionData } from "./model";
import { StoreAction } from "./storage";

export const prepActionForStorage = (action: ActionData): StoreAction => {
  return {
    id: action.id,
    name: action.name,
    icon: action.icon,
    requiredConfidence: action.requiredConfidence,
    recordingIds: action.recordings.map((r) => r.id),
    createdAt: action.createdAt,
  };
};
