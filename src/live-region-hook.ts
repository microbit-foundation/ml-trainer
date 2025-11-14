import { useEffect, useState } from "react";
import { LiveRegion, LiveRegionOptions } from "./live-region";

export const useLiveRegion = (
  parentNode: HTMLElement | null,
  options: Partial<LiveRegionOptions> = {}
) => {
  const [liveRegion] = useState(() => new LiveRegion(options));

  useEffect(() => {
    if (parentNode) {
      liveRegion.setupLiveRegion(parentNode);
    }

    return () => liveRegion.destroy();
  }, [liveRegion, parentNode]);

  return liveRegion;
};
