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
  Stack,
  Text,
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
          <Emoji ml="10px" boxSize={16} animation={animations.spin} />
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

export const RecordFirstActionHint = () => {
  const { isConnected } = useConnectionStage();
  return (
    <HStack m={0} p={2} transform="translateX(65px)" w="calc(100% - 65px)">
      <UpCurveArrow w="60px" h="93px" color="brand.500" />
      {isConnected ? (
        <>
          <Text textAlign="center" maxW={200} alignSelf="center">
            <FormattedMessage
              id="record-hint-button-b"
              values={{ mark: (chunks) => <strong>{chunks}</strong> }}
            />
          </Text>
          <Image src={microbitButtonB} alt="" pl={3} alignSelf="center" />
        </>
      ) : (
        <Text textAlign="center" maxW={125}>
          <FormattedMessage id="record-hint" />
        </Text>
      )}
    </HStack>
  );
};

export const RecordHint = () => {
  const { isConnected } = useConnectionStage();
  return (
    <VStack
      position="absolute"
      m={0}
      p={2}
      transform="translate(170px, -110px)"
      w="calc(100% - 65px)"
      alignItems="flex-start"
    >
      <Box transform="rotate(-8deg)">
        <EmojiArrow color="brand.500" />
      </Box>
      <HStack transform="translateX(20px)">
        {isConnected ? (
          <>
            <Text textAlign="center" maxW={200} alignSelf="center">
              <FormattedMessage
                id="record-hint-button-b"
                values={{ mark: (chunks) => <strong>{chunks}</strong> }}
              />
            </Text>
            <Image src={microbitButtonB} alt="" pl={3} alignSelf="center" />
          </>
        ) : (
          <Text textAlign="center" maxW={125}>
            <FormattedMessage id="record-hint" />
          </Text>
        )}
      </HStack>
    </VStack>
  );
};

export const RecordMoreHint = ({ recorded }: { recorded: number }) => {
  return (
    <HStack
      m={0}
      p={2}
      transform="translate(65px, 0)"
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
        <Text textAlign="center">
          <FormattedMessage
            id="record-more-hint"
            values={{ numSamples: recorded === 1 ? 2 : 1 }}
          />
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
      <Text textAlign="center">
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

export const MoveMicrobitHint = () => {
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
        <AspectRatio ratio={30 / 25} w={36} animation={animations.wobble}>
          <Image src={moveMicrobitImage} />
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
        <Text textAlign="center" zIndex={3}>
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
