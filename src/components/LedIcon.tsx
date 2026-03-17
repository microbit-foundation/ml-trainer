/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { AspectRatio, Box, HStack, keyframes, VStack } from "@chakra-ui/react";
import { memo, useCallback, useEffect, useRef } from "react";
import { icons, LedIconType } from "../utils/icons";
import { useIntl } from "react-intl";
import { useStore } from "../store";

interface LedIconProps {
  actionId?: string;
  icon: LedIconType;
  size?: string | number;
  isTriggerable: boolean;
}

const LedIcon = ({
  icon,
  size = 20,
  actionId,
  isTriggerable,
}: LedIconProps) => {
  const iconData = icons[icon];
  const intl = useIntl();
  const iconRef = useRef<HTMLDivElement>(null);

  const getOnColor = useCallback(
    (isTriggered?: boolean) => {
      if (!isTriggerable) {
        return "var(--chakra-colors-brand-500)";
      } else if (isTriggered) {
        return "var(--chakra-colors-brand2-500)";
      } else {
        return "var(--chakra-colors-gray-600)";
      }
    },
    [isTriggerable]
  );

  useEffect(() => {
    if (!isTriggerable) {
      iconRef.current?.style.setProperty("--led-on-color", getOnColor());
    } else {
      return useStore.subscribe(
        (store) => store.predictionResult?.detected?.id === actionId,
        (isTriggered: boolean) => {
          if (!iconRef.current) return;
          iconRef.current.style.setProperty(
            "--led-on-color",
            getOnColor(isTriggered)
          );
        }
      );
    }
  }, [actionId, isTriggerable, getOnColor]);

  return (
    <AspectRatio
      width={size}
      height={size}
      ratio={1}
      role="img"
      aria-label={intl.formatMessage({
        id: `led-icon-option-${icon.toLowerCase()}`,
      })}
    >
      <VStack
        w="100%"
        h="100%"
        spacing={0.5}
        ref={iconRef}
        style={
          {
            "--led-off-color": "var(--chakra-colors-gray-200)",
            "--led-on-color": getOnColor(),
          } as React.CSSProperties
        }
      >
        {Array.from(Array(5)).map((_, idx) => {
          const start = idx * 5;
          return (
            <LedIconRow key={idx} data={iconData.substring(start, start + 5)} />
          );
        })}
      </VStack>
    </AspectRatio>
  );
};

const turnOn = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
`;

const turnOff = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.8);
  }
  100% {
    transform: scale(1);
  }
`;

interface LedIconRowProps {
  data: string;
}

const LedIconRow = ({ data }: LedIconRowProps) => {
  const turnOnAnimation = `${turnOn} 200ms ease`;
  const turnOffAnimation = `${turnOff} 200ms ease`;

  return (
    <HStack w="100%" h="100%" spacing={0.5}>
      {Array.from(Array(5)).map((_, idx) => (
        <Box
          h="100%"
          w="100%"
          key={idx}
          bgColor={
            data[idx] === "1" ? "var(--led-on-color)" : "var(--led-off-color)"
          }
          borderRadius="sm"
          transitionTimingFunction="ease"
          transitionProperty="background-color"
          transitionDuration="200ms"
          animation={data[idx] === "1" ? turnOnAnimation : turnOffAnimation}
        />
      ))}
    </HStack>
  );
};

export default memo(LedIcon);
