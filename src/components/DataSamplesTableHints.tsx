/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  AspectRatio,
  Box,
  HStack,
  Image,
  keyframes,
  Stack,
  Text,
  usePrefersReducedMotion,
  VisuallyHidden,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { useConnectionStage } from "../connection-stage-hooks";
import microbitButtonB from "../images/microbit-button-b.svg";
import moveMicrobitImage from "../images/move-microbit.svg";
import { Action } from "../model";
import Emoji, { animations, EmojiAi } from "./Emoji";
import EmojiArrow from "./EmojiArrow";
import UpCurveArrow from "./UpCurveArrow";

export const NameFirstActionHint = () => {
  return (
    <VStack m={0} p={2} w={200} transform="translate(-30px, 45px)">
      <Stack spacing={0} color="brand.500" ml={-8}>
        <EmojiArrow />
        <Box transform="rotate(-8deg)">
          <Emoji ml="25px" boxSize={16} animation={animations.spin} />
        </Box>
      </Stack>
      <Text textAlign="center">
        <FormattedMessage id="name-action-hint" />
      </Text>
    </VStack>
  );
};

export const NameActionHint = () => {
  return (
    <VStack m={0} p={2} w="300px" transform="translate(30px, 40px)" spacing={0}>
      <Stack spacing={0} ml={-8}>
        <EmojiArrow color="brand.500" />
        <HStack>
          <Box transform="rotate(-8deg)" color="brand.500">
            <Emoji ml="25px" boxSize={16} />
          </Box>
          <Text textAlign="center">
            <FormattedMessage id="name-action-hint" />
          </Text>
        </HStack>
      </Stack>
    </VStack>
  );
};

export const NameActionShortHint = () => {
  return (
    <VStack
      h="100%"
      justifyContent="center"
      p={2}
      w="360px"
      spacing={0}
      transform="translate(-25px)"
      position="absolute"
    >
      <HStack ml="15px" gap={1}>
        <EmojiArrow
          color="brand.500"
          left={0}
          transform="translate(0, -30px) rotate(-35deg)"
          mr={-4}
        />
        <Box transform="rotate(-8deg)" color="brand.500">
          <Emoji boxSize={16} />
        </Box>
        <Text textAlign="center">
          <FormattedMessage id="name-action-hint" />
        </Text>
      </HStack>
    </VStack>
  );
};

export const NameActionWithSamplesHint = () => {
  return (
    <HStack
      m={0}
      p={2}
      transform="translate(200px, 0)"
      gap={3}
      alignItems="center"
    >
      <HStack spacing={0} color="brand.500" ml={-8}>
        <UpCurveArrow w="60px" h="93px" color="brand.500" />
        <Box transform="rotate(-8deg)">
          <Emoji ml="10px" boxSize={16} />
        </Box>
      </HStack>
      <Text
        textAlign="center"
        width="100%"
        position="absolute"
        transform="translate(120px, 0)"
      >
        <FormattedMessage id="name-action-hint" />
      </Text>
    </HStack>
  );
};

const RecordHintWithButtonB = () => {
  return (
    <>
      <Text textAlign="center" maxW={200} alignSelf="center">
        <FormattedMessage
          id="record-hint-button-b"
          values={{ mark: (chunks) => <strong>{chunks}</strong> }}
        />
      </Text>
      <Image src={microbitButtonB} pl={3} alignSelf="center" aria-hidden />
    </>
  );
};

export const RecordHint = () => {
  const { isConnected } = useConnectionStage();
  return (
    <HStack
      position="absolute"
      w="400px"
      p={2}
      top={0}
      height="100%"
      transform="translate(131px, 0)"
      alignItems="start"
    >
      {isConnected ? (
        <>
          <EmojiArrow
            color="brand.500"
            top={0}
            left={0}
            transform="rotate(-35deg) translate(0,0)"
            mr={1}
          />
          <RecordHintWithButtonB />
        </>
      ) : (
        <>
          <EmojiArrow
            color="brand.500"
            top={0}
            left={0}
            transform="rotate(-20deg) translate(0,0)"
            mr={1}
          />
          <Text
            textAlign="center"
            maxW={200}
            transform="translate(-30px, 30px)"
          >
            <FormattedMessage id="record-hint" />
          </Text>
        </>
      )}
    </HStack>
  );
};

export const RecordMoreHint = ({
  recorded,
  actionName,
}: {
  recorded: number;
  actionName: string;
}) => {
  const numSamples = recorded === 1 ? 2 : 1;
  return (
    <HStack
      m={0}
      p={2}
      transform="translate(65px, -12px)"
      w="calc(100% - 65px)"
      alignItems="start"
    >
      <Box transform="translateY(-23px)">
        <UpCurveArrow w="60px" h="93px" color="brand.500" />
      </Box>
      <HStack gap={3}>
        <Emoji
          transform="rotate(-8deg)"
          leftEye={recorded == 2 ? "tick" : "round"}
        />
        <VisuallyHidden>
          <Text>
            <FormattedMessage
              id="record-more-hint-label"
              values={{ numSamples, actionName }}
            />
          </Text>
        </VisuallyHidden>
        <Text textAlign="center" aria-hidden>
          <FormattedMessage id="record-more-hint" values={{ numSamples }} />
        </Text>
      </HStack>
    </HStack>
  );
};

export const AddActionHint = ({ action }: { action: Action }) => {
  return (
    <HStack
      m={0}
      position="absolute"
      left={16}
      bottom={12}
      spacing={3}
      alignItems="flex-start"
    >
      <HStack spacing={0} alignItems="flex-start">
        <EmojiArrow
          w="60px"
          h="93px"
          color="brand.500"
          transform="rotate(-80deg)"
        />
        <Box transform="rotate(-8deg)">
          <Emoji
            leftEye="tick"
            rightEye="tick"
            pb={3}
            animation={animations.spin}
          />
        </Box>
      </HStack>
      <VisuallyHidden>
        <Text>
          <FormattedMessage
            id="add-action-hint-label"
            values={{ actionName: action.name }}
          />
        </Text>
      </VisuallyHidden>
      <Text textAlign="center" aria-hidden>
        <FormattedMessage
          id="add-action-hint"
          values={{
            actionName: action.name,
            mark: (chunks) => (
              <>
                <br />
                {chunks}
              </>
            ),
          }}
        />
      </Text>
    </HStack>
  );
};

// Timeout for move micro:bit hint before assuming user already knows and setting hasMoved to true.
// 28s = 4 wobble cycles × 2s + 4 pause cycles × 5s
export const moveMicrobitHintTimeoutInSec = 28; //s

const moveMicrobitEmojiKeyframes = keyframes({
  // Wobble for 2s.
  "0%": {
    transform: "rotate(0deg)",
  },
  "1.79%": {
    transform: "rotate(22deg)",
  },
  "3.57%": {
    transform: "rotate(-18deg)",
  },
  "5.36%": {
    transform: "rotate(14deg)",
  },
  "7.14%": {
    transform: "rotate(-10deg)",
  },
  "8.93%": {
    transform: "rotate(0deg)",
  },
  // Wait 5 seconds. Wobble again for another 2s.
  "26.79%": {
    transform: "rotate(0deg)",
  },
  "28.57%": {
    transform: "rotate(22deg)",
  },
  "30.36%": {
    transform: "rotate(-18deg)",
  },
  "32.14%": {
    transform: "rotate(14deg)",
  },
  "33.93%": {
    transform: "rotate(-10deg)",
  },
  "35.71%": {
    transform: "rotate(0deg)",
  },
  // Wait 5 seconds. Wobble again for another 2s.
  "53.57%": {
    transform: "rotate(0deg)",
  },
  "55.36%": {
    transform: "rotate(22deg)",
  },
  "57.14%": {
    transform: "rotate(-18deg)",
  },
  "58.93%": {
    transform: "rotate(14deg)",
  },
  "60.71%": {
    transform: "rotate(-10deg)",
  },
  "62.5%": {
    transform: "rotate(0deg)",
  },
  // Wait 5 seconds. Wobble again for another 2s.
  "80.36%": {
    transform: "rotate(0deg)",
  },
  "82.14%": {
    transform: "rotate(22deg)",
  },
  "83.93%": {
    transform: "rotate(-18deg)",
  },
  "85.71%": {
    transform: "rotate(14deg)",
  },
  "87.5%": {
    transform: "rotate(-10deg)",
  },
  "89.29%": {
    transform: "rotate(0deg)",
  },
  // Wait 5 seconds.
  "100%": {
    transform: "rotate(0deg)",
  },
});

export const MoveMicrobitHint = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  return (
    <HStack
      m={0}
      position="absolute"
      right={16}
      bottom={16}
      spacing={0}
      zIndex={2}
    >
      <HStack>
        <Box
          position="absolute"
          background="radial-gradient(50% 50% at 50% 50%, rgba(245,245,245,1) 75%, rgba(245,245,245,0) 100%);"
          bottom={0}
          right={-16}
          w="calc(100% + 50px)"
          h="120%"
        />
        <EmojiArrow
          mt={8}
          transform="rotate(-80deg)"
          transformOrigin="center"
          color="brand.500"
        />
        {/* Ratio hides excess whitespace */}
        <AspectRatio
          ratio={30 / 25}
          w={36}
          animation={
            prefersReducedMotion
              ? undefined
              : `${moveMicrobitEmojiKeyframes} ${moveMicrobitHintTimeoutInSec}s`
          }
        >
          <Image src={moveMicrobitImage} aria-hidden />
        </AspectRatio>
        <Text textAlign="center" w={48} zIndex={3}>
          <FormattedMessage id="move-hint" />
        </Text>
      </HStack>
    </HStack>
  );
};

export const TrainHint = () => {
  return (
    <HStack
      m={0}
      position="absolute"
      right={0}
      spacing={0}
      zIndex={2}
      transform="translate(-80px, -85px)"
    >
      <HStack>
        <Box
          position="absolute"
          background="radial-gradient(50% 50% at 50% 50%, rgba(245,245,245,1) 75%, rgba(245,245,245,0) 100%);"
          transform="translate(-50px, 0)"
          w="calc(100% + 50px)"
          h="120%"
        />
        <EmojiAi boxSize={20} pb={3} animation={animations.spin} zIndex={3} />
        <VisuallyHidden>
          <Text>
            <FormattedMessage id="train-hint-label" />
          </Text>
        </VisuallyHidden>
        <Text textAlign="center" zIndex={3} aria-hidden>
          <FormattedMessage
            id="train-hint"
            values={{
              mark: (chunks) => (
                <>
                  <br />
                  {chunks}
                </>
              ),
            }}
          />
        </Text>
        <EmojiArrow
          mt={8}
          transform="rotate(-120deg) scaleY(-1)"
          transformOrigin="center"
          color="brand.500"
        />
      </HStack>
    </HStack>
  );
};
