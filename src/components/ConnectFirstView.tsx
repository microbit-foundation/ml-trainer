import { Button, Text, VStack } from "@chakra-ui/react";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { useConnectionStage } from "../connection-stage-hooks";

const ConnectFirstView = () => {
  const connecting = false;
  const isReconnect = false;
  const { actions } = useConnectionStage();

  const handleConnect = useCallback(() => {
    actions.startConnect();
  }, [actions]);

  return (
    <VStack
      flexGrow={1}
      justifyContent="center"
      alignItems="center"
      gap={10}
      bgColor="gray.25"
    >
      <VStack gap={0}>
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
