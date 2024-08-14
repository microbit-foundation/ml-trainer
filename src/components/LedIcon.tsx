import { AspectRatio, Box, HStack, keyframes, VStack } from "@chakra-ui/react";
import { memo, useCallback } from "react";
import { icons, LedIconType } from "../utils/icons";

interface LedIconProps {
  icon: LedIconType;
  isTestModelPage?: boolean;
  isTriggered?: boolean;
  size?: string | number;
}

const LedIcon = ({
  icon,
  isTestModelPage,
  isTriggered,
  size = 20,
}: LedIconProps) => {
  const iconData = icons[icon];
  return (
    <AspectRatio width={size} height={size} ratio={1}>
      <VStack w="100%" h="100%" spacing={0.5}>
        {Array.from(Array(5)).map((_, idx) => {
          const start = idx * 5;
          return (
            <LedIconRow
              key={idx}
              data={iconData.substring(start, start + 5)}
              isTestModelPage={!!isTestModelPage}
              isTriggered={!!isTriggered}
            />
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
  isTestModelPage: boolean;
  isTriggered: boolean;
}

const LedIconRow = ({
  data,
  isTestModelPage,
  isTriggered,
}: LedIconRowProps) => {
  const turnOnAnimation = `${turnOn} 200ms ease`;
  const turnOffAnimation = `${turnOff} 200ms ease`;
  const getBgColor = useCallback(
    (isOn: boolean) => {
      if (!isOn) {
        return "gray.200";
      }
      if (isTestModelPage && isTriggered) {
        return "green.500";
      }
      if (isTestModelPage && !isTriggered) {
        return "gray.600";
      }
      return "brand.500";
    },
    [isTriggered, isTestModelPage]
  );
  return (
    <HStack w="100%" h="100%" spacing={0.5}>
      {Array.from(Array(5)).map((_, idx) => (
        <Box
          h="100%"
          w="100%"
          key={idx}
          bg={getBgColor(data[idx] === "1")}
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
