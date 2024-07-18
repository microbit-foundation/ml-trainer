import { Button, HStack, Portal, Text } from "@chakra-ui/react";
import { useCallback, useRef } from "react";
import { MdBolt } from "react-icons/md";
import { FormattedMessage } from "react-intl";
import { useConnections } from "../connections-hooks";
import InfoToolTip from "./InfoToolTip";
import LiveGraph from "./LiveGraph";
import { useConnectionStage } from "../connection-stage-hooks";

const LiveGraphPanel = () => {
  const { actions } = useConnectionStage();
  const { isInputConnected } = useConnections();
  const parentPortalRef = useRef(null);

  const handleDisconnect = useCallback(() => {
    actions.disconnect();
  }, [actions]);

  const handleConnect = useCallback(() => {
    // TODO: Handle incompatibility dialog and reconnection
    actions.start();
  }, [actions]);
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
            {isInputConnected ? (
              <Button variant="primary" size="sm" onClick={handleDisconnect}>
                <FormattedMessage id="footer.disconnectButton" />
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleConnect}>
                <FormattedMessage id="footer.connectButton" />
              </Button>
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
