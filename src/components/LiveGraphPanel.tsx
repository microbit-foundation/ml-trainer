import { Button, HStack, Text } from "@chakra-ui/react";
import { MdBolt } from "react-icons/md";
import { FormattedMessage } from "react-intl";
import InfoToolTip from "./InfoToolTip";
import LiveGraph from "./LiveGraph";
import { useConnections } from "../connections";

const LiveGraphPanel = () => {
  const { inputConnection } = useConnections();
  const isConnected = inputConnection.connectionStatus === "connected";
  return (
    <HStack position="relative" h={160} width="100%" bgColor="white">
      <HStack
        justifyContent="space-between"
        position="absolute"
        top={0}
        left={0}
        right={0}
        px={7}
        py={4}
        zIndex={1}
      >
        <HStack gap={4}>
          <LiveIndicator />
          {isConnected ? (
            <Button variant="primary" size="sm">
              <FormattedMessage id="footer.disconnectButton" />
            </Button>
          ) : (
            <Button variant="primary" size="sm">
              <FormattedMessage id="footer.connectButton" />
            </Button>
          )}
        </HStack>
        <InfoToolTip
          titleId="footer.helpHeader"
          descriptionId="footer.helpContent"
        />
      </HStack>
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
