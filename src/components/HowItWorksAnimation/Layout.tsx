import { HStack, StackProps, Stack, keyframes } from "@chakra-ui/react";
import { useImperativeHandle, forwardRef, useState, ReactNode } from "react";
import { delayInSec } from "../../utils/delay";

const shrinkWidth = keyframes({ "0%": {}, "100%": { width: 0 } });

const enlarge = keyframes({
  "0%": { transform: "scale(1.0)" },
  "100%": { transform: "scale(1.2)" },
});

interface LayoutProps extends StackProps {
  leftItems: ReactNode;
  middleItems: ReactNode;
  rightItems: ReactNode;
}

export interface LayoutRef {
  playCenteringLeft(durationInSec?: number): Promise<void>;
}

const Layout = forwardRef<LayoutRef, LayoutProps>(function Signal(
  { leftItems, middleItems, rightItems, ...props }: LayoutProps,
  ref
) {
  const [centerLeftDuration, setCenterLeftDuration] = useState<number | null>(
    null
  );

  useImperativeHandle(
    ref,
    () => ({
      async playCenteringLeft(durationInSec = 1) {
        console.log("pkla");
        setCenterLeftDuration(durationInSec);
        await delayInSec(durationInSec);
      },
    }),
    []
  );

  return (
    <HStack
      alignItems="center"
      gap={centerLeftDuration ? 0 : 5}
      transition="gap 0.3s ease"
      justifyContent="center"
      {...props}
    >
      {/* Left */}
      <Stack
        width={200}
        animation={
          centerLeftDuration ? `${enlarge} 1s ease-in-out forwards` : undefined
        }
      >
        {leftItems}
      </Stack>
      {/* Middle */}
      <Stack
        animation={
          centerLeftDuration ? `${shrinkWidth} 1s ease-in-out` : undefined
        }
      >
        {middleItems}
      </Stack>
      {/* Right */}
      <Stack
        width={230}
        animation={
          centerLeftDuration
            ? `${shrinkWidth} ${centerLeftDuration}s ease-in-out forwards`
            : undefined
        }
      >
        {rightItems}
      </Stack>
    </HStack>
  );
});

export default Layout;
