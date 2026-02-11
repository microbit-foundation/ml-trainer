import { ActionData } from "./model";
import { StoreAction } from "./storage";

export const prepActionForStorage = (
  action: ActionData,
  projectId: string
): StoreAction => {
  return {
    id: action.id,
    name: action.name,
    icon: action.icon,
    requiredConfidence: action.requiredConfidence,
    createdAt: action.createdAt,
    projectId,
  };
};
