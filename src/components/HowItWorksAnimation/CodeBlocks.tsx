/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, Icon, IconProps, keyframes } from "@chakra-ui/react";
import { useImperativeHandle, forwardRef, useState } from "react";
import { useAnimation } from "../AnimationProvider";

export interface CodeBlockRef {
  play(durationInSecs?: number): Promise<void>;
  reset(): void;
}

const innerBlockKeyframeBase = keyframes({
  "0%": {
    left: "100%",
    top: "80%",
    transform: "rotate(-30deg)",
  },
  "100%": {
    left: "10%",
    top: "17%",
    transform: "rotate(0deg)",
  },
});

const innerBlockKeyframeSm = keyframes({
  "0%": {
    left: "100%",
    top: "80%",
    transform: "rotate(-30deg)",
  },
  "100%": {
    left: "8%",
    top: "13%",
    transform: "rotate(0deg)",
  },
});

const outerBlockSize = { base: "4em", sm: "6em" };
const innerBlockSize = { base: "3em", sm: "5em" };

const CodeBlock = forwardRef<CodeBlockRef, IconProps>(function CodeBlock(
  { ...props },
  ref
) {
  const { delayInSec } = useAnimation();
  const [duration, setDuration] = useState<number | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      async play(secs = 1) {
        setDuration(secs);
        await delayInSec(secs);
      },
      reset() {
        setDuration(null);
      },
    }),
    [delayInSec]
  );
  return (
    <Box position="relative">
      <OuterCodeBlock
        width={outerBlockSize}
        height={outerBlockSize}
        color="brand.500"
        {...props}
      />
      {duration && (
        <InnerCodeBlock
          position="absolute"
          width={innerBlockSize}
          height={innerBlockSize}
          animation={{
            base: `${innerBlockKeyframeBase} ${duration}s ease-in-out forwards`,
            sm: `${innerBlockKeyframeSm} ${duration}s ease-in-out forwards`,
          }}
          color="brand.500"
        />
      )}
    </Box>
  );
});

const OuterCodeBlock = (props: IconProps) => (
  <Icon viewBox="0 0 210 145.3" fill="none" {...props}>
    <path
      d="M206.5,26.5V10c0-3.6-2.9-6.5-6.5-6.5H10c-3.6,0-6.5,2.9-6.5,6.5v125.3c0,3.6,2.9,6.5,6.5,6.5h189.9c3.6,0,6.5-2.9,6.5-6.5v-15.1c0-3.6-2.9-6.5-6.5-6.5l-112.5-.3c-.3,0-.3,0-.4.2l-7.5,9.1c-1.7,1.9-3.9,2.9-6.2,2.9h-19.9c-2.3,0-4.5-1-6.1-2.9l-7.5-9.1c0-.2-.2-.3-.6-.3h-10.7c-2.1,0-4.1-.8-5.6-2.3-1.5-1.7-2.3-3.6-2.3-5.6l.2-58.8c0-2,.9-4.1,2.3-5.6,1.6-1.5,3.6-2.3,5.6-2.3h10.7c2.5,0,4.8,1.1,6.1,3l7.4,9.1c.1.2.3.3.8.4h19.7c.2,0,.4,0,.6-.3l7.5-9.1c1.6-1.8,3.8-2.9,6.1-2.9l112.3.2c3.6,0,6.5-2.9,6.5-6.5v-5.8Z"
      fill="white"
      stroke="currentColor"
      strokeWidth="7"
      strokeMiterlimit="10"
    />
  </Icon>
);

const InnerCodeBlock = (props: IconProps) => (
  <Icon viewBox="0 0 170.8 94" fill="none" {...props}>
    {/* Outline shape */}
    <path
      d="M56.2,90.5h-19.9c-2.3,0-4.5-1-6.1-2.9l-7.5-9.1c-.1-.2-.2-.3-.6-.3h-10.7c-2.1,0-4.1-.8-5.6-2.3-1.5-1.7-2.3-3.6-2.3-5.6l.2-58.8c0-2,.9-4.1,2.3-5.6,1.7-1.5,3.6-2.3,5.6-2.3h10.7c2.5,0,4.8,1.1,6.1,3l7.4,9.1c.1.2.3.3.8.4h19.7c.2,0,.4,0,.6-.3l7.5-9.1c1.6-1.8,3.8-2.9,6.1-2.9l88.7.2c4.4,0,7.9,3.6,7.9,7.9v58.7c-.1,2-1,4.1-2.5,5.6-1.6,1.5-3.6,2.3-5.6,2.3l-88.8-.2c-.3,0-.3,0-.4.2l-7.5,9.1c-1.7,1.9-3.9,2.9-6.2,2.9h0Z"
      fill="white"
      stroke="currentColor"
      strokeWidth="7"
      strokeMiterlimit="10"
    />
    {/* Keypad dots */}
    <path
      fill="currentColor"
      d="M110.5,17h6.1c.4,0,.7.3.7.7v6.1c0,.4-.3.7-.7.7h-6.1c-.4,0-.7-.3-.7-.7v-6.1c0-.4.3-.7.7-.7"
    />
    <path
      fill="currentColor"
      d="M129.5,17h6.1c.4,0,.7.3.7.7v6.1c0,.4-.3.7-.7.7h-6.1c-.4,0-.7-.3-.7-.7v-6.1c0-.4.3-.7.7-.7"
    />
    <path
      fill="currentColor"
      d="M101.1,26.5h6.1c.4,0,.7.3.7.7v6.1c0,.4-.3.7-.7.7h-6.1c-.4,0-.7-.3-.7-.7v-6.1c0-.4.3-.7.7-.7"
    />
    <path
      fill="currentColor"
      d="M110.5,26.5h6.1c.4,0,.7.3.7.7v6.1c0,.4-.3.7-.7.7h-6.1c-.4,0-.7-.3-.7-.7v-6.1c0-.5.3-.8.7-.7"
    />
    <path
      fill="currentColor"
      d="M120,26.5h6.1c.4,0,.7.3.7.7v6.1c0,.4-.3.7-.7.7h-6.1c-.4,0-.7-.3-.7-.7v-6.1c0-.4.3-.7.7-.7"
    />
    <path
      fill="currentColor"
      d="M129.5,26.5h6.1c.4,0,.7.3.7.7v6.1c0,.4-.3.7-.7.7h-6.1c-.4,0-.7-.3-.7-.7v-6.1c0-.4.3-.7.7-.7"
    />
    <path
      fill="currentColor"
      d="M138.9,26.5h6.1c.4,0,.7.3.7.7v6.1c0,.4-.3.7-.7.7h-6.1c-.4,0-.7-.3-.7-.7v-6.1c0-.5.3-.8.7-.7"
    />
    <path
      fill="currentColor"
      d="M101.1,36h6.1c.4,0,.7.3.7.7v6.1c0,.4-.3.7-.7.7h-6.1c-.4,0-.7-.3-.7-.7v-6.1c0-.4.3-.7.7-.7"
    />
    <path
      fill="currentColor"
      d="M110.5,36h6.1c.4,0,.7.3.7.7v6.1c0,.4-.3.7-.7.7h-6.1c-.4,0-.7-.3-.7-.7v-6.1c0-.4.3-.7.7-.7"
    />
    <path
      fill="currentColor"
      d="M120,36h6.1c.4,0,.7.3.7.7v6.1c0,.4-.3.7-.7.7h-6.1c-.4,0-.7-.3-.7-.7v-6.1c0-.4.3-.7.7-.7"
    />
    <path
      fill="currentColor"
      d="M129.5,36h6.1c.4,0,.7.3.7.7v6.1c0,.4-.3.7-.7.7h-6.1c-.4,0-.7-.3-.7-.7v-6.1c0-.4.3-.7.7-.7"
    />
    <path
      fill="currentColor"
      d="M138.9,36h6.1c.4,0,.7.3.7.7v6.1c0,.4-.3.7-.7.7h-6.1c-.4,0-.7-.3-.7-.7v-6.1c0-.4.3-.7.7-.7"
    />
    <path
      fill="currentColor"
      d="M110.5,45.4h6.1c.4,0,.7.3.7.7v6.1c0,.4-.3.7-.7.7h-6.1c-.4,0-.7-.3-.7-.7v-6.1c0-.4.3-.7.7-.7"
    />
    <path
      fill="currentColor"
      d="M120,45.4h6.1c.4,0,.7.3.7.7v6.1c0,.4-.3.7-.7.7h-6.1c-.4,0-.7-.3-.7-.7v-6.1c0-.4.3-.7.7-.7"
    />
    <path
      fill="currentColor"
      d="M129.5,45.4h6.1c.4,0,.7.3.7.7v6.1c0,.4-.3.7-.7.7h-6.1c-.4,0-.7-.3-.7-.7v-6.1c0-.4.3-.7.7-.7"
    />
    <path
      fill="currentColor"
      d="M120,54.9h6.1c.4,0,.7.3.7.7v6.1c0,.4-.3.7-.7.7h-6.1c-.4,0-.7-.3-.7-.7v-6.1c0-.4.3-.7.7-.7"
    />
  </Icon>
);

export default CodeBlock;
