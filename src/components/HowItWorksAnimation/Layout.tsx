/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode, forwardRef, useImperativeHandle, useState } from "react";
import { HStack, Stack } from "@microbit/ui";
import { useAnimation } from "../AnimationProvider";

interface LayoutProps {
  leftItems: ReactNode;
  middleItems: ReactNode;
  rightItems: ReactNode;
}

export interface LayoutRef {
  playCenteringLeft(durationInSec?: number): Promise<void>;
  reset(): void;
}

const Layout = forwardRef<LayoutRef, LayoutProps>(function Layout(
  { leftItems, middleItems, rightItems }: LayoutProps,
  ref
) {
  const { delayInSec } = useAnimation();
  const [centerLeftDuration, setCenterLeftDuration] = useState<number | null>(
    null
  );

  useImperativeHandle(
    ref,
    () => ({
      async playCenteringLeft(durationInSec = 1) {
        setCenterLeftDuration(durationInSec);
        await delayInSec(durationInSec);
      },
      reset() {
        setCenterLeftDuration(null);
      },
    }),
    [delayInSec]
  );

  return (
    <HStack
      alignItems="center"
      gap={centerLeftDuration ? 0 : { base: 1, md: 5 }}
      style={{
        transition: centerLeftDuration
          ? `gap ${centerLeftDuration}s ease`
          : undefined,
      }}
      justifyContent="center"
    >
      {/* Left */}
      <Stack
        width={centerLeftDuration ? "45%" : undefined}
        transform={
          centerLeftDuration
            ? { base: "scale(1)", sm: "scale(1.2)" }
            : undefined
        }
        style={{
          transition: centerLeftDuration
            ? `transform ${centerLeftDuration}s ease`
            : undefined,
        }}
        alignItems={centerLeftDuration ? "center" : "end"}
        position="relative"
      >
        {leftItems}
      </Stack>
      {/* Middle */}
      <Stack
        alignItems="center"
        // "0%" not 0: a percentage is treated as auto in the row's intrinsic
        // width calculation, so the collapsed item still props up the row and
        // the left stack's 45% resolves against the full-size row.
        width={centerLeftDuration ? "0%" : undefined}
        style={{
          transition: centerLeftDuration
            ? `width ${centerLeftDuration}s ease`
            : undefined,
        }}
      >
        {middleItems}
      </Stack>
      {/* Right */}
      <Stack
        // "0%" not 0 — see the middle stack's comment.
        width={centerLeftDuration ? "0%" : undefined}
        style={{
          transition: centerLeftDuration
            ? `width ${centerLeftDuration}s ease`
            : undefined,
        }}
        alignItems="start"
      >
        {rightItems}
      </Stack>
    </HStack>
  );
});

export default Layout;
