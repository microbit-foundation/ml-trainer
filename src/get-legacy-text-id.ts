import { isNativePlatform } from "./platform";

// Temporary helper to avoiding untranslated text on web platform.
export const getLegacyTextIdIfNeeded = ({
  legacyId,
  id,
}: {
  legacyId: string;
  id: string;
}) => {
  return isNativePlatform() ? id : legacyId;
};
