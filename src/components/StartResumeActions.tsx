import { Button, HStack, StackProps, useDisclosure } from "@chakra-ui/react";
import { useCallback, useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import { useGestureActions } from "../gestures-hooks";
import { createStepPageUrl } from "../urls";
import StartOverWarningDialog from "./StartOverWarningDialog";
import { useConnectionStage } from "../connection-stage-hooks";

const StartResumeActions = ({ ...props }: Partial<StackProps>) => {
  const gestureActions = useGestureActions();
  const hasExistingSession = useMemo(
    () => gestureActions.hasGestures(),
    [gestureActions]
  );
  const startOverWarningDialogDisclosure = useDisclosure();
  const navigate = useNavigate();
  const { actions: connStageActions, isConnected } = useConnectionStage();

  const handleNavigateToAddData = useCallback(() => {
    navigate(createStepPageUrl("add-data"));
  }, [navigate]);

  const handleStartNewSession = useCallback(() => {
    gestureActions.deleteAllGestures();
    if (isConnected) {
      handleNavigateToAddData();
    } else {
      connStageActions.start();
    }
  }, [gestureActions, connStageActions, handleNavigateToAddData, isConnected]);

  const onClickStartNewSession = useCallback(() => {
    if (hasExistingSession) {
      startOverWarningDialogDisclosure.onOpen();
    } else {
      startOverWarningDialogDisclosure.onClose();
      handleStartNewSession();
    }
  }, [
    handleStartNewSession,
    hasExistingSession,
    startOverWarningDialogDisclosure,
  ]);

  return (
    <>
      <StartOverWarningDialog
        isOpen={startOverWarningDialogDisclosure.isOpen}
        onClose={startOverWarningDialogDisclosure.onClose}
        onStart={handleStartNewSession}
      />
      <HStack w="100%" justifyContent="center" gap={5} {...props}>
        {hasExistingSession && (
          <Button size="lg" variant="primary" onClick={handleNavigateToAddData}>
            <FormattedMessage id="footer.resume" />
          </Button>
        )}
        <Button
          onClick={onClickStartNewSession}
          size="lg"
          variant={hasExistingSession ? "secondary" : "primary"}
        >
          <FormattedMessage id="footer.start" />
        </Button>
      </HStack>
    </>
  );
};

export default StartResumeActions;
