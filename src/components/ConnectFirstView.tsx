import { Button, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { useConnectionFlow } from "../connections";
import { useCallback } from "react";
import { ConnEvent } from "../connection-flow";

const ConnectFirstView = () => {
  const connecting = false;
  const isReconnect = false;
  const { dispatch } = useConnectionFlow();

  const handleConnect = useCallback(() => {
    dispatch(ConnEvent.Start);
  }, [dispatch]);

  return (
    <VStack flexGrow={1} justifyContent="center" alignItems="center" gap={10}>
      <VStack>
        <Text textAlign="center" fontSize="2xl">
          <FormattedMessage id="menu.trainer.notConnected1" />
        </Text>
        <Text textAlign="center" fontSize="2xl">
          <FormattedMessage id="menu.trainer.notConnected2" />
        </Text>
      </VStack>
      <Button variant="primary" isDisabled={connecting} onClick={handleConnect}>
        {isReconnect ? (
          <FormattedMessage id="actions.reconnect" />
        ) : (
          <FormattedMessage id="footer.connectButton" />
        )}
      </Button>
    </VStack>
  );
};
export default ConnectFirstView;
