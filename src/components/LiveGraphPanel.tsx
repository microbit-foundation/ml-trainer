import {
  Button,
  HStack,
  Portal,
  Text,
  VisuallyHidden,
  VStack,
} from "@chakra-ui/react";
import { useMemo, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ConnectionStatus } from "../connect-status-hooks";
import { useConnectionStage } from "../connection-stage-hooks";
import { Gesture } from "../model";
import { tourElClassname } from "../tours";
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
  const intl = useIntl();
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
          textId: "connect-action",
          onClick: actions.startConnect,
        }
      : {
          textId: "reconnect-action",
          onClick: actions.reconnect,
        };
  }, [actions.startConnect, actions.reconnect, status]);

  return (
    <HStack
      position="relative"
      h={160}
      width="100%"
      bgColor="white"
      ref={parentPortalRef}
      className={tourElClassname.liveGraph}
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
            showPredictedGesture ? `${predictedGestureDisplayWidth}px` : "0"
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
              />
            </HStack>
            {status === ConnectionStatus.Connected ? (
              <Button
                backgroundColor="white"
                variant="secondary"
                size="sm"
                onClick={actions.disconnect}
              >
                <FormattedMessage id="disconnect-action" />
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
                <FormattedMessage id="reconnecting" />
              </Text>
            )}
          </HStack>
        </HStack>
      </Portal>
      <HStack position="absolute" width="100%" height="100%" spacing={0}>
        <LiveGraph />
        {showPredictedGesture && (
          <VStack
            className={tourElClassname.estimatedAction}
            w={`${predictedGestureDisplayWidth}px`}
            gap={0}
            h="100%"
            py={2.5}
            pt={3.5}
          >
            <VisuallyHidden aria-live="polite">
              <FormattedMessage
                id="estimated-action-aria"
                values={{
                  action:
                    detected?.name ?? intl.formatMessage({ id: "unknown" }),
                }}
              />
            </VisuallyHidden>
            <HStack justifyContent="flex-start" w="100%" gap={2} pr={2} mb={3}>
              <Text size="md" fontWeight="bold" alignSelf="start">
                <FormattedMessage id="estimated-action-label" />
              </Text>
              <InfoToolTip
                titleId="estimated-action-label"
                descriptionId="estimated-action-tooltip"
              />
            </HStack>
            <VStack justifyContent="center" flexGrow={1} mb={0.5}>
              <LedIcon icon={detected?.icon ?? "off"} size="70px" isTriggered />
            </VStack>
            <Text
              size="md"
              fontWeight="bold"
              color={detected ? "brand2.600" : "gray.600"}
              isTruncated
              textAlign="center"
              w={`${predictedGestureDisplayWidth}px`}
            >
              {detected?.name ?? <FormattedMessage id="unknown" />}
            </Text>
          </VStack>
        )}
      </HStack>
    </HStack>
  );
};

export default LiveGraphPanel;
