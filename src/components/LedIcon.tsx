import { AspectRatio, Box, HStack, keyframes, VStack } from "@chakra-ui/react";
import { MakeCodeIcon, makecodeIcons } from "../utils/makecode-icons";

interface LedIconProps {
  icon: MakeCodeIcon;
}

const LedIcon = ({ icon }: LedIconProps) => {
  const iconData = makecodeIcons[icon];
  return (
    <AspectRatio width={20} ratio={1}>
      <VStack w={20} h={20} spacing={0.5}>
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

interface LedIconRowProps {
  data: string;
}

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

const LedIconRow = ({ data }: LedIconRowProps) => {
  const turnOnAnimation = `${turnOn} 200ms ease`;
  const turnOffAnimation = `${turnOff} 200ms ease`;

  return (
    <HStack w="100%" h={4} spacing={0.5}>
      {Array.from(Array(5)).map((_, idx) => (
        <Box
          h="100%"
          w="100%"
          key={idx}
          bg={data[idx] === "1" ? "brand.500" : "gray.200"}
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

export default LedIcon;
