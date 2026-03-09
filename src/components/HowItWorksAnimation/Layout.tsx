import { HStack, Stack, StackProps } from "@chakra-ui/react";
import { ReactNode, forwardRef, useImperativeHandle, useState } from "react";
import { useAnimation } from "../AnimationProvider";

interface LayoutProps extends StackProps {
  leftItems: ReactNode;
  middleItems: ReactNode;
  rightItems: ReactNode;
}

export interface LayoutRef {
  playCenteringLeft(durationInSec?: number): Promise<void>;
  reset(): void;
}

const Layout = forwardRef<LayoutRef, LayoutProps>(function Signal(
  { leftItems, middleItems, rightItems, ...props }: LayoutProps,
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
      transition={
        centerLeftDuration ? `gap ${centerLeftDuration}s ease` : undefined
      }
      justifyContent="center"
      {...props}
    >
      {/* Left */}
      <Stack
        width={centerLeftDuration ? "45%" : undefined}
        transform={
          centerLeftDuration
            ? { base: "scale(1)", sm: "scale(1.2)" }
            : undefined
        }
        transition={
          centerLeftDuration
            ? `transform ${centerLeftDuration}s ease`
            : undefined
        }
        alignItems={centerLeftDuration ? "center" : "end"}
      >
        {leftItems}
      </Stack>
      {/* Middle */}
      <Stack
        width={centerLeftDuration ? 0 : undefined}
        transition={
          centerLeftDuration ? `width ${centerLeftDuration}s ease` : undefined
        }
      >
        {middleItems}
      </Stack>
      {/* Right */}
      <Stack
        width={centerLeftDuration ? 0 : undefined}
        transition={
          centerLeftDuration ? `width ${centerLeftDuration}s ease` : undefined
        }
        alignItems="start"
      >
        {rightItems}
      </Stack>
    </HStack>
  );
});

export default Layout;
