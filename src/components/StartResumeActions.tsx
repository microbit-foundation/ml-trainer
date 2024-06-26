import { Button, HStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

const StartResumeActions = () => {
  // TODO hasExistingSession to check local storage
  const hasExistingSession = true;
  return (
    <HStack w="100%" justifyContent="center" gap={5}>
      {hasExistingSession && (
        <Button size="lg" variant="primary">
          <FormattedMessage id="footer.resume" />
        </Button>
      )}
      <Button size="lg" variant={hasExistingSession ? "secondary" : "primary"}>
        <FormattedMessage id="footer.start" />
      </Button>
    </HStack>
  );
};

export default StartResumeActions;
