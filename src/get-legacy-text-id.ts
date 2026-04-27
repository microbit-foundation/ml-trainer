import { Capacitor } from "@capacitor/core";

// Temporary helper to avoiding untranslated text on web platform.
export const getLegacyTextIdIfNeeded = ({
  legacyId,
  id,
}: {
  legacyId: string;
  id: string;
}) => {
  return Capacitor.getPlatform() === "web" ? legacyId : id;
};
