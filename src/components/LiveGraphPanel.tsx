import { Button, HStack, Portal, Text, VStack } from "@chakra-ui/react";
import { useMemo, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { ConnectionStatus } from "../connect-status-hooks";
import { useConnectionStage } from "../connection-stage-hooks";
import { Gesture } from "../model";
import InfoToolTip from "./InfoToolTip";
import LedIcon from "./LedIcon";
import LiveGraph from "./LiveGraph";

interface LiveGraphPanelProps {
  detected?: Gesture | undefined;
  showPredictedGesture?: boolean;
}

const predictedGestureDisplayWidth = 180;

const LiveGraphPanel = ({
  showPredictedGesture,
  detected,
}: LiveGraphPanelProps) => {
  const { actions, status } = useConnectionStage();
  const parentPortalRef = useRef(null);
  const isReconnecting =
    status === ConnectionStatus.ReconnectingAutomatically ||
    status === ConnectionStatus.ReconnectingExplicitly;
  const connectBtnConfig = useMemo(() => {
    return status === ConnectionStatus.NotConnected ||
      status === ConnectionStatus.Connecting ||
      status === ConnectionStatus.FailedToConnect ||
      status === ConnectionStatus.FailedToReconnectTwice ||
      status === ConnectionStatus.FailedToSelectBluetoothDevice
      ? {
          textId: "footer.connectButton",
          onClick: actions.startConnect,
        }
      : {
          textId: "actions.reconnect",
          onClick: actions.reconnect,
        };
  }, [actions.reconnect, actions.startConnect, status]);

  return (
    <HStack
      position="relative"
      h={160}
      width="100%"
      bgColor="white"
      ref={parentPortalRef}
    >
      <Portal containerRef={parentPortalRef}>
        <HStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          px={2.5}
          py={2.5}
          w={`calc(100% - ${
            showPredictedGesture ? `${predictedGestureDisplayWidth}px` : "0"
          })`}
        >
          <HStack gap={4}>
            <HStack gap={2}>
              <Text fontWeight="bold">Live data graph</Text>
              <InfoToolTip
                titleId="footer.helpHeader"
                descriptionId="footer.helpContent"
              />
            </HStack>
            {status === ConnectionStatus.Connected ? (
              <Button
                backgroundColor="white"
                variant="secondary"
                size="sm"
                onClick={actions.disconnect}
              >
                <FormattedMessage id="footer.disconnectButton" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                isDisabled={
                  isReconnecting || status === ConnectionStatus.Connecting
                }
                onClick={connectBtnConfig.onClick}
              >
                <FormattedMessage id={connectBtnConfig.textId} />
              </Button>
            )}
            {isReconnecting && (
              <Text rounded="4xl" bg="white" py="1px" fontWeight="bold">
                <FormattedMessage id="connectMB.reconnecting" />
              </Text>
            )}
          </HStack>
        </HStack>
      </Portal>
      <HStack position="absolute" width="100%" height="100%" spacing={0}>
        <LiveGraph />
        {showPredictedGesture && (
          <VStack
            w={`${predictedGestureDisplayWidth}px`}
            gap={0}
            h="100%"
            py={2.5}
            pt={3.5}
          >
            <HStack justifyContent="flex-start" w="100%" gap={2} pr={2}>
              <Text size="md" fontWeight="bold" alignSelf="start">
                <FormattedMessage id="content.model.output.estimatedGesture.iconTitle" />
              </Text>
              <InfoToolTip
                titleId="content.model.output.estimatedGesture.descriptionTitle"
                descriptionId="content.model.output.estimatedGesture.descriptionBody"
              />
            </HStack>
            <Text size="md" isTruncated w={`${predictedGestureDisplayWidth}px`}>
              {detected?.name ?? (
                <FormattedMessage id="content.model.output.estimatedGesture.none" />
              )}
            </Text>
            <VStack justifyContent="center" flexGrow={1}>
              <LedIcon icon={detected?.icon ?? "off"} size="80px" isTriggered />
            </VStack>
          </VStack>
        )}
      </HStack>
    </HStack>
  );
};

export default LiveGraphPanel;
