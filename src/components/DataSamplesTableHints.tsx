/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { FormattedMessage } from "react-intl";
import { useDataConnected } from "../data-connection-flow";
import microbitButtonB from "../images/microbit-button-b.svg";
import moveMicrobitImage from "../images/move-microbit.svg";
import { Action } from "../model";
import {
  AspectRatio,
  Box,
  css,
  HStack,
  Image,
  Stack,
  Text,
  VStack,
} from "../shared-ui";
import Emoji, { EmojiAi } from "./Emoji";
import EmojiArrow from "./EmojiArrow";
import UpCurveArrow from "./UpCurveArrow";

const spinAnimation = css({
  animation: "spin3d 2s",
  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
});

export const NameFirstActionHint = () => {
  return (
    <VStack m={0} p={2} w="200px" transform="translate(-30px, 45px)">
      <Stack gap={0} color="brand.500" ml={-8}>
        <EmojiArrow />
        <Box transform="rotate(-8deg)">
          <Emoji className={css({ ml: "25px" }) + " " + spinAnimation} />
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
    <VStack m={0} p={2} w="300px" transform="translate(30px, 40px)" gap={0}>
      <Stack gap={0} ml={-8}>
        <EmojiArrow className={css({ color: "brand.500" })} />
        <HStack>
          <Box transform="rotate(-8deg)" color="brand.500">
            <Emoji className={css({ ml: "25px" })} />
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
      gap={0}
      transform="translate(-25px)"
      position="absolute"
    >
      <HStack ml="15px" gap={1}>
        <EmojiArrow
          className={css({
            color: "brand.500",
            left: 0,
            transform: "translate(0, -30px) rotate(-35deg)",
            mr: -4,
          })}
        />
        <Box transform="rotate(-8deg)" color="brand.500">
          <Emoji />
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
      <HStack gap={0} color="brand.500" ml={-8}>
        <UpCurveArrow />
        <Box transform="rotate(-8deg)">
          <Emoji className={css({ ml: "10px" })} />
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
      <Text textAlign="center" maxW="200px" alignSelf="center">
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
  const isConnected = useDataConnected();
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
            className={css({
              color: "brand.500",
              top: 0,
              left: 0,
              transform: "rotate(-35deg) translate(0,0)",
              mr: 1,
            })}
          />
          <RecordHintWithButtonB />
        </>
      ) : (
        <>
          <EmojiArrow
            className={css({
              color: "brand.500",
              top: 0,
              left: 0,
              transform: "rotate(-20deg) translate(0,0)",
              mr: 1,
            })}
          />
          <Text
            textAlign="center"
            maxW="250px"
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
        <UpCurveArrow />
      </Box>
      <HStack gap={3}>
        <Emoji
          className={css({ transform: "rotate(-8deg)" })}
          leftEye={recorded == 2 ? "tick" : "round"}
        />
        <span className={css({ srOnly: true })}>
          <FormattedMessage
            id="record-more-hint-label"
            values={{ numSamples, actionName }}
          />
        </span>
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
      gap={3}
      alignItems="flex-start"
    >
      <HStack gap={0} alignItems="flex-start">
        <EmojiArrow
          size="tall"
          className={css({
            color: "brand.500",
            transform: "rotate(-80deg)",
          })}
        />
        <Box transform="rotate(-8deg)">
          <Emoji
            leftEye="tick"
            rightEye="tick"
            className={css({ pb: 3 }) + " " + spinAnimation}
          />
        </Box>
      </HStack>
      <span className={css({ srOnly: true })}>
        <FormattedMessage
          id="add-action-hint-label"
          values={{ actionName: action.name }}
        />
      </span>
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

export const MoveMicrobitHint = () => {
  return (
    <HStack m={0} position="absolute" right={16} bottom={16} gap={0} zIndex={2}>
      <HStack>
        <Box
          position="absolute"
          background="radial-gradient(50% 50% at 50% 50%, rgba(245,245,245,1) 75%, rgba(245,245,245,0) 100%)"
          bottom={0}
          right={-16}
          w="calc(100% + 50px)"
          h="120%"
        />
        <EmojiArrow
          className={css({
            mt: 8,
            transform: "rotate(-80deg)",
            transformOrigin: "center",
            color: "brand.500",
          })}
        />
        {/* Ratio hides excess whitespace */}
        <AspectRatio
          ratio={30 / 25}
          w={36}
          // Keyframes match moveMicrobitHintTimeoutInSec (28s).
          css={{
            animation: "microbitWobble 28s",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
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
      gap={0}
      zIndex={2}
      transform="translate(-80px, -85px)"
    >
      <HStack>
        <Box
          position="absolute"
          background="radial-gradient(50% 50% at 50% 50%, rgba(245,245,245,1) 75%, rgba(245,245,245,0) 100%)"
          transform="translate(-50px, 0)"
          w="calc(100% + 50px)"
          h="120%"
        />
        <EmojiAi
          size="20"
          className={css({ pb: 3, zIndex: 3 }) + " " + spinAnimation}
        />
        <span className={css({ srOnly: true })}>
          <FormattedMessage id="train-hint-label" />
        </span>
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
          className={css({
            mt: 8,
            transform: "rotate(-120deg) scaleY(-1)",
            transformOrigin: "center",
            color: "brand.500",
          })}
        />
      </HStack>
    </HStack>
  );
};
