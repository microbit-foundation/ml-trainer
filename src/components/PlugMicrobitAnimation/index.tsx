/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, css, Image } from "../../shared-ui";
import connectorImage from "../../images/micro-usb-connector.png";
import microbitImage from "../../images/microbit.png";
import { useAnimation } from "../AnimationProvider";

const cycleDuration = 3;
const connectorLifted = "translate(-52%, -35%)";
const connectorPlugged = "translate(-52%, 25%)";

interface PlugMicrobitAnimationProps {
  /**
   * Accessible description of the animation.
   */
  alt: string;
  /**
   * Plays the unplug animation instead of the plug-in one.
   */
  unplug?: boolean;
  width?: string;
}

const PlugMicrobitAnimation = ({
  alt,
  unplug = false,
  width = "225px",
}: PlugMicrobitAnimationProps) => {
  const { withPlayState } = useAnimation();
  // Preset keyframes (see panda-preset.ts) encode the connector positions.
  const connectorKeyframes = unplug ? "unplug" : "plugIn";
  const glowKeyframes = unplug ? "plugGlowOff" : "plugGlowOn";
  return (
    <Box
      role="img"
      aria-label={alt}
      position="relative"
      overflow="hidden"
      pt="12%"
      userSelect="none"
      // Width varies by call site; forwarded style props aren't extracted.
      style={{ width }}
    >
      <Box position="relative" width="100%">
        <Box
          position="absolute"
          left="40%"
          top="16%"
          width="23%"
          aspectRatio="1"
          transform="translate(-75%, -75%)"
          borderRadius="full"
          backgroundImage="radial-gradient(closest-side, rgba(255, 199, 0, 0.55) 50%, transparent)"
          opacity={0}
          style={{
            animation: withPlayState(
              `${glowKeyframes} ${cycleDuration}s ease-in-out infinite`
            ),
          }}
        />
        <Image
          src={connectorImage}
          alt=""
          position="absolute"
          left="50%"
          bottom="100%"
          width="17%"
          style={{
            transform: unplug ? connectorLifted : connectorPlugged,
            animation: withPlayState(
              `${connectorKeyframes} ${cycleDuration}s ease-in-out infinite`
            ),
          }}
        />
        {/* Plain img: width/height must stay HTML attributes (intrinsic size,
            Chakra's htmlWidth/htmlHeight); on styled Image they'd be style
            props. */}
        <img
          src={microbitImage}
          alt=""
          width={1280}
          height={1030}
          className={css({
            display: "block",
            width: "100%",
            maxWidth: "100%",
            position: "relative",
          })}
        />
      </Box>
    </Box>
  );
};

export default PlugMicrobitAnimation;
