import { Button, HStack } from "@chakra-ui/react";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import { createStepPageUrl } from "../urls";

const StartResumeActions = () => {
  // TODO hasExistingSession to check local storage
  const hasExistingSession = true;
  const navigate = useNavigate();

  const handleNewSession = useCallback(() => {
    navigate(createStepPageUrl("add-data"));
  }, [navigate]);
  return (
    <HStack w="100%" justifyContent="center" gap={5}>
      {hasExistingSession && (
        <Button size="lg" variant="primary">
          <FormattedMessage id="footer.resume" />
        </Button>
      )}
      <Button
        onClick={handleNewSession}
        size="lg"
        variant={hasExistingSession ? "secondary" : "primary"}
      >
        <FormattedMessage id="footer.start" />
      </Button>
    </HStack>
  );
};

export default StartResumeActions;
