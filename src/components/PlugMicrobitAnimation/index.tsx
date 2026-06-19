/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, BoxProps, Image, keyframes } from "@chakra-ui/react";
import connectorImage from "../../images/micro-usb-connector.png";
import microbitImage from "../../images/microbit.png";
import { useAnimation } from "../AnimationProvider";

const cycleDuration = 3;
const connectorWidth = "17%";
const connectorHeadroom = "12%";
const glowColor = "rgba(255, 199, 0, 0.55)";
const connectorLifted = "translate(-52%, -35%)";
const connectorPlugged = "translate(-52%, 25%)";

const plugInKeyframes = keyframes({
  "0%": { transform: connectorLifted },
  "25%, 100%": { transform: connectorPlugged },
});

const glowOnKeyframes = keyframes({
  "0%, 30%": { opacity: 0 },
  "40%, 100%": { opacity: 1 },
});

const unplugKeyframes = keyframes({
  "0%, 10%": { transform: connectorPlugged },
  "50%, 100%": { transform: connectorLifted },
});

const glowOffKeyframes = keyframes({
  "0%, 8%": { opacity: 1 },
  "10%, 100%": { opacity: 0 },
});

interface PlugMicrobitAnimationProps extends BoxProps {
  /**
   * Accessible description of the animation.
   */
  alt: string;
  /**
   * Plays the unplug animation instead of the plug-in one.
   */
  unplug?: boolean;
  /**
   * Width of the animation.
   */
  width?: string;
}

const PlugMicrobitAnimation = ({
  alt,
  unplug = false,
  width,
  ...props
}: PlugMicrobitAnimationProps) => {
  const { withPlayState } = useAnimation();
  const connectorKeyframes = unplug ? unplugKeyframes : plugInKeyframes;
  const glowKeyframes = unplug ? glowOffKeyframes : glowOnKeyframes;
  return (
    <Box
      role="img"
      aria-label={alt}
      position="relative"
      overflow="hidden"
      width={width ?? "225px"}
      pt={connectorHeadroom}
      userSelect="none"
      {...props}
    >
      <Box position="relative" width="100%">
        <Box
          position="absolute"
          left="50%"
          top="50%"
          width="70%"
          aspectRatio="1"
          transform="translate(-75%, -75%)"
          borderRadius="full"
          bgGradient={`radial(closest-side, ${glowColor}, transparent)`}
          opacity={0}
          animation={withPlayState(
            `${glowKeyframes} ${cycleDuration}s ease-in-out infinite`
          )}
        />
        <Image
          src={connectorImage}
          alt=""
          position="absolute"
          left="50%"
          bottom="100%"
          width={connectorWidth}
          transform={unplug ? connectorLifted : connectorPlugged}
          animation={withPlayState(
            `${connectorKeyframes} ${cycleDuration}s ease-in-out infinite`
          )}
        />
        <Image
          src={microbitImage}
          alt=""
          display="block"
          width="100%"
          position="relative"
        />
      </Box>
    </Box>
  );
};

export default PlugMicrobitAnimation;
