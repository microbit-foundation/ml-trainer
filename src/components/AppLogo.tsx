/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { css, HStack, SystemStyleObject } from "../shared-ui";
import { useDeployment } from "../deployment";

interface AppLogoProps {
  /** Divider tint. */
  color?: string;
  /** Per-instance style overrides (transform etc.), merged last. */
  css?: SystemStyleObject;
}

const AppLogo = ({ color = "#FFF", css: cssProp }: AppLogoProps) => {
  const { AppLogo, OrgLogo } = useDeployment();
  return (
    <HStack
      gap={4}
      userSelect="none"
      transform="scale(0.93)"
      transformOrigin="left"
      color="white"
      css={cssProp}
    >
      {OrgLogo && (
        <>
          <OrgLogo />
          {/* Chakra's vertical Divider with borderWidth 1px (so ~2px wide). */}
          <div
            aria-hidden
            className={css({
              borderWidth: "1px",
              borderStyle: "solid",
              opacity: 0.6,
              height: "33px",
            })}
            style={{ borderColor: color }}
          />
        </>
      )}
      <AppLogo h="19px" />
    </HStack>
  );
};

export default AppLogo;
