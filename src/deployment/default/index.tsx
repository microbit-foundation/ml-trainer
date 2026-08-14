/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { BrandConfigFactory, LogoProps } from "..";

const defaultBrandFactory: BrandConfigFactory = () => ({
  appNameFull: "ml-trainer",
  appNameShort: "ml-trainer",
  product: "ml-trainer",
  // Inline styles rather than Panda: the private brand package is resolved
  // from node_modules, outside Panda's extraction scope, so logo components
  // keep to plain elements on both sides.
  AppLogo: ({ h }: LogoProps) => {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: h,
          color: "white",
          fontWeight: "bold",
        }}
      >
        <span>ml-trainer</span>
      </div>
    );
  },
  OrgLogo: undefined,
  supportLinks: {
    // Just placeholders, these need replacing in a real deployment with branded help content.
    bluetooth: "https://support.microbit.org",
    main: "https://support.microbit.org",
    troubleshooting: "https://support.microbit.org",
    wearable: "https://support.microbit.org",
  },
});

export default defaultBrandFactory;
