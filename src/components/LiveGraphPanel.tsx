import { Button, HStack, Portal, Text, VStack } from "@chakra-ui/react";
import { useMemo, useRef } from "react";
import { MdBolt } from "react-icons/md";
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
          px={7}
          py={4}
          w={`calc(100% - ${
            showPredictedGesture ? `${predictedGestureDisplayWidth}px` : "0"
          })`}
        >
          <HStack gap={4}>
            <HStack gap={2}>
              <InfoToolTip
                titleId="footer.helpHeader"
                descriptionId="footer.helpContent"
              />
              <MdBolt size={24} />
              <Text fontWeight="bold">LIVE</Text>
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
          <HStack
            justifyContent="left"
            alignItems="start"
            w={`${predictedGestureDisplayWidth}px`}
          >
            <VStack pt={0.8}>
              <InfoToolTip
                titleId="content.model.output.estimatedGesture.descriptionTitle"
                descriptionId="content.model.output.estimatedGesture.descriptionBody"
              />
            </VStack>
            <VStack alignItems="left" gap={1}>
              <VStack gap={0}>
                <Text size="sm">
                  <FormattedMessage id="content.model.output.estimatedGesture.iconTitle" />
                </Text>
                <Text isTruncated w="110px">
                  {detected?.name ?? (
                    <FormattedMessage id="content.model.output.estimatedGesture.none" />
                  )}
                </Text>
              </VStack>
              <LedIcon icon={detected?.icon ?? "off"} size="80px" isTriggered />
            </VStack>
          </HStack>
        )}
      </HStack>
    </HStack>
  );
};

export default LiveGraphPanel;
