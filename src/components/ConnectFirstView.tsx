import { Button, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

const ConnectFirstView = () => {
  const connecting = false;
  const isReconnect = false;

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
      <Button variant="primary" isDisabled={connecting}>
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
