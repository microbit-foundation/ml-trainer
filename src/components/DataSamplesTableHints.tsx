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
import { Action } from "../model";
import Emoji, { animations } from "./Emoji";
import EmojiArrow from "./EmojiArrow";
import UpCurveArrow from "./UpCurveArrow";
import moveMicrobitImage from "../images/move-microbit.svg";

export const NameActionHint = () => {
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

export const RecordButtonHint = () => {
  const { isConnected } = useConnectionStage();
  return (
    <HStack m={0} p={2} transform="translateX(65px)" w="calc(100% - 65px)">
      <UpCurveArrow w="60px" h="93px" color="brand.500" />
      {/* Emoji? Or explain button B visually? */}
      {isConnected ? (
        <Text textAlign="center" maxW={200}>
          <FormattedMessage id="record-hint-button-b" />
        </Text>
      ) : (
        <Text textAlign="center" maxW={125}>
          <FormattedMessage id="record-hint" />
        </Text>
      )}
    </HStack>
  );
};

export const RecordMoreHint = ({ recorded }: { recorded: number }) => {
  return (
    <HStack m={0} p={2} transform="translateX(65px)" w="calc(100% - 65px)">
      <UpCurveArrow w="60px" h="93px" color="brand.500" />
      <Emoji
        transform="rotate(-8deg)"
        leftEye={recorded == 2 ? "tick" : "round"}
      />
      <Text maxW="20ch" textAlign="center">
        {recorded === 1
          ? "Record at least 2 more data samples"
          : "Record at least 1 more data sample"}
      </Text>
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
        Finished recording for {action.name}?<br />
        Add another action
      </Text>
    </HStack>
  );
};

export const MoveMicrobitHint = () => {
  return (
    <HStack m={0} position="absolute" right={16} bottom={12} spacing={0}>
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
      <Text textAlign="center" w={48}>
       Move with the micro:bit, such as shake or clap, and watch the graph change.
      </Text>
    </HStack>
  );
};
