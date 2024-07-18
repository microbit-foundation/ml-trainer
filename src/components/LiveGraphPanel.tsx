import { Button, HStack, Portal, Text } from "@chakra-ui/react";
import { useMemo, useRef } from "react";
import { MdBolt } from "react-icons/md";
import { FormattedMessage } from "react-intl";
import { useConnectionStage } from "../connection-stage-hooks";
import { ConnectionStatus, useConnections } from "../connections-hooks";
import InfoToolTip from "./InfoToolTip";
import LiveGraph from "./LiveGraph";

const LiveGraphPanel = () => {
  const { actions } = useConnectionStage();
  const { inputConnection } = useConnections();
  const parentPortalRef = useRef(null);

  const connectBtnConfig = useMemo(
    () =>
      inputConnection.status === ConnectionStatus.None ||
      inputConnection.status === ConnectionStatus.Connecting
        ? {
            textId: "footer.connectButton",
            onClick: actions.start,
          }
        : {
            textId: "actions.reconnect",
            onClick: actions.reconnect,
          },
    [actions.reconnect, actions.start, inputConnection]
  );

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
        >
          <HStack gap={4}>
            <LiveIndicator />
            {inputConnection.status === ConnectionStatus.Connected ? (
              <Button variant="primary" size="sm" onClick={actions.disconnect}>
                <FormattedMessage id="footer.disconnectButton" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                isDisabled={
                  inputConnection.status === ConnectionStatus.Reconnecting ||
                  inputConnection.status === ConnectionStatus.Connecting
                }
                onClick={connectBtnConfig.onClick}
              >
                <FormattedMessage id={connectBtnConfig.textId} />
              </Button>
            )}
            {inputConnection.status === ConnectionStatus.Reconnecting && (
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
      <HStack position="absolute" width="100%" height="100%">
        <LiveGraph />
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
