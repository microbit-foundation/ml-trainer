import Gesture from '../domain/Gesture';

export const generateCustomJson = (gs: Gesture[]) => {
  return JSON.stringify(
    gs.map(g => ({
      ID: g.getId(),
      name: g.getName(),
      numRecordings: g.getRecordings().length,
      requiredConfidence: g.getConfidence().getRequiredConfidence(),
    })),
  );
};
