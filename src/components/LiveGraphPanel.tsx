/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  BoxProps,
  Button,
  HStack,
  Icon,
  Image,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useDataConnectionActions } from "../data-connection-flow";
import {
  DataConnectionStep,
  isDataConnectionDialogOpen,
} from "../data-connection-flow";
import { useStore } from "../store";
import microbitImage from "../images/stylised-microbit-black.svg";
import { keyboardShortcuts, useShortcut } from "../keyboard-shortcut-hooks";
import { useLogging } from "../logging/logging-hooks";
import { tourElClassname } from "../tours";
import AlertIcon from "./AlertIcon";
import InfoToolTip from "./InfoToolTip";
import LiveGraph from "./LiveGraph";
import PredictedAction from "./PredictedAction";

interface LiveGraphPanelProps {
  showPredictedAction?: boolean;
  disconnectedTextId: string;
}

export const predictedActionDisplayWidth = 180;

const LiveGraphPanel = ({
  showPredictedAction,
  disconnectedTextId,
}: LiveGraphPanelProps) => {
  const actions = useDataConnectionActions();
  const dataConnection = useStore((s) => s.dataConnection);
  const isConnected = dataConnection.step === DataConnectionStep.Connected;
  const isReconnecting = dataConnection.isReconnecting;
  const parentPortalRef = useRef(null);
  const logging = useLogging();

  // Show disconnected state when not connected, not reconnecting, and don't distract from dialogs.
  const isDisconnected =
    !isConnected &&
    !isReconnecting &&
    !isDataConnectionDialogOpen(dataConnection.step);

  const handleConnectOrReconnect = useCallback(() => {
    logging.event({
      type: "connect-user",
    });
    actions.connect();
  }, [actions, logging]);
  useShortcut(keyboardShortcuts.connect, handleConnectOrReconnect, {
    enabled: isDisconnected,
  });
  const handleDisconnect = useCallback(() => {
    logging.event({
      type: "disconnect-user",
    });
    void actions.disconnect();
  }, [actions, logging]);
  useShortcut(keyboardShortcuts.disconnect, handleDisconnect, {
    enabled: isConnected,
  });
  const intl = useIntl();
  return (
    <HStack
      role="region"
      aria-label={intl.formatMessage({ id: "data-connection-region" })}
      position="relative"
      h={160}
      width="100%"
      bgColor="white"
      className={tourElClassname.liveGraph}
    >
      {isDisconnected && (
        <HStack
          position="absolute"
          w="100%"
          h="100%"
          gap={10}
          justifyContent="center"
          zIndex={1}
        >
          <MicrobitWarningIllustration
            display={{ base: "none", sm: "block" }}
          />
          <VStack gap={3} alignItems="self-start">
            <Text fontWeight="bold">
              <FormattedMessage id="microbit-not-connected" />
            </Text>
            <Text>
              <FormattedMessage id={disconnectedTextId} />
            </Text>
            <Button
              variant="primary"
              onClick={handleConnectOrReconnect}
              aria-label={intl.formatMessage({ id: "connect-action-aria" })}
            >
              <FormattedMessage id="connect-action" />
            </Button>
          </VStack>
        </HStack>
      )}
      <HStack
        ref={parentPortalRef}
        pointerEvents={isDisconnected ? "none" : undefined}
        opacity={isDisconnected ? 0.2 : undefined}
      >
        <Portal containerRef={parentPortalRef}>
          <HStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            px={5}
            py={2.5}
            w={`calc(100% - ${
              showPredictedAction ? `${predictedActionDisplayWidth}px` : "0"
            })`}
          >
            <HStack gap={4}>
              <HStack gap={2}>
                <Text fontWeight="bold">
                  <FormattedMessage id="live-data-graph" />
                </Text>
                <InfoToolTip
                  titleId="live-graph"
                  descriptionId="live-graph-tooltip"
                  isDisabled={isDisconnected}
                />
              </HStack>
              {isConnected && (
                <Button
                  backgroundColor="white"
                  variant="secondary"
                  size="xs"
                  onClick={handleDisconnect}
                >
                  <FormattedMessage id="disconnect-action" />
                </Button>
              )}
              {isReconnecting && (
                <Text bg="white" fontWeight="bold">
                  <FormattedMessage id="reconnecting" />
                </Text>
              )}
            </HStack>
          </HStack>
        </Portal>
        <HStack position="absolute" width="100%" height="100%" spacing={0}>
          <LiveGraph />
          {showPredictedAction && <PredictedAction />}
        </HStack>
      </HStack>
    </HStack>
  );
};

const MicrobitWarningIllustration = (props: BoxProps) => (
  <HStack position="relative" aria-hidden {...props}>
    <Image src={microbitImage} objectFit="contain" boxSize="120px" bottom={0} />
    <Icon
      as={AlertIcon}
      position="absolute"
      top={-1}
      fill="#ffde21"
      right={-5}
      boxSize="55px"
    />
  </HStack>
);

export default LiveGraphPanel;
