import type * as tf from "@tensorflow/tfjs";
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

/**
 * Normalize tfjs weight data (one buffer or several) to a single ArrayBuffer
 * for consistent serialization.
 */
export const weightDataToArrayBuffer = (
  weightData: tf.io.ModelArtifacts["weightData"]
): ArrayBuffer | undefined => {
  if (!weightData) {
    return undefined;
  }
  const buffers = Array.isArray(weightData) ? weightData : [weightData];
  if (buffers.length === 1) {
    return buffers[0];
  }
  const totalByteLength = buffers.reduce((acc, b) => acc + b.byteLength, 0);
  const combined = new Uint8Array(totalByteLength);
  let offset = 0;
  for (const buffer of buffers) {
    combined.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  return combined.buffer;
};
