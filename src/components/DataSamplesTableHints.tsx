/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, GridItem, HStack, Stack, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { useConnectionStage } from "../connection-stage-hooks";
import Emoji, { animations } from "./Emoji";
import EmojiArrow from "./EmojiArrow";
import UpCurveArrow from "./UpCurveArrow";

export const NameActionHint = () => {
  return (
    <GridItem h="120px">
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
    </GridItem>
  );
};

export const RecordButtonHint = () => {
  const { isConnected } = useConnectionStage();
  return (
    <GridItem h="120px">
      <HStack m={0} p={2} transform="translateX(65px)" w="calc(100% - 65px)">
        <UpCurveArrow w="60px" h="93px" color="brand.500" />
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
    </GridItem>
  );
};
