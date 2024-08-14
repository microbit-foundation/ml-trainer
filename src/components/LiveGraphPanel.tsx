import { Box, Button, HStack, Portal, Text } from "@chakra-ui/react";
import { useMemo, useRef } from "react";
import { MdBolt } from "react-icons/md";
import { FormattedMessage } from "react-intl";
import { ConnectionStatus } from "../connect-status-hooks";
import { useConnectionStage } from "../connection-stage-hooks";
import { getPredictedGesture, usePrediction } from "../ml-hooks";
import InfoToolTip from "./InfoToolTip";
import LedIcon from "./LedIcon";
import LiveGraph from "./LiveGraph";
import { useGestureData } from "../gestures-hooks";

interface LiveGraphPanelProps {
  isTestModelPage?: boolean;
}

const LiveGraphPanel = ({ isTestModelPage = false }: LiveGraphPanelProps) => {
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

  const confidences = usePrediction();
  const [gestures] = useGestureData();
  const predictedGesture = getPredictedGesture(gestures, confidences);

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
          justifyContent="space-between"
          position="absolute"
          top={0}
          left={0}
          right={0}
          px={7}
          py={4}
          w={`calc(100% - ${isTestModelPage ? "160px" : "0"})`}
        >
          <HStack gap={4}>
            <LiveIndicator />
            {status === ConnectionStatus.Connected ? (
              <Button variant="primary" size="sm" onClick={actions.disconnect}>
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
          <InfoToolTip
            titleId="footer.helpHeader"
            descriptionId="footer.helpContent"
          />
        </HStack>
      </Portal>
      <HStack position="absolute" width="100%" height="100%" spacing={0}>
        <LiveGraph />
        {isTestModelPage && (
          <Box px={5}>
            <LedIcon
              icon={predictedGesture?.icon ?? "off"}
              size="120px"
              isTestModelPage={true}
              isTriggered={true}
            />
          </Box>
        )}
      </HStack>
    </HStack>
  );
};

const LiveIndicator = () => (
  <HStack gap={2}>
    <MdBolt size={24} />
    <Text fontWeight="bold">LIVE</Text>
  </HStack>
);

export default LiveGraphPanel;
