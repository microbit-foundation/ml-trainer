import { Button, HStack, StackProps, useDisclosure } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import { useGestureActions } from "../gestures-hooks";
import { createStepPageUrl } from "../urls";
import StartOverWarningDialog from "./StartOverWarningDialog";
import { useConnectionStage } from "../connection-stage-hooks";
import { ConnectionStatus } from "../connect-status-hooks";
import { useProject } from "../user-projects-hooks";

const StartResumeActions = ({ ...props }: Partial<StackProps>) => {
  const gestureActions = useGestureActions();
  const { resetProject } = useProject();
  const hasExistingSession = useMemo(
    () => gestureActions.hasGestures(),
    [gestureActions]
  );
  const [hasConnectFlowStarted, setHasConnectFlowStarted] =
    useState<boolean>(false);
  const startOverWarningDialogDisclosure = useDisclosure();
  const navigate = useNavigate();
  const {
    actions: connStageActions,
    isConnected,
    status,
  } = useConnectionStage();

  const handleNavigateToAddData = useCallback(() => {
    navigate(createStepPageUrl("add-data"));
  }, [navigate]);

  const handleStartNewSession = useCallback(() => {
    startOverWarningDialogDisclosure.onClose();
    gestureActions.deleteAllGestures();
    resetProject();
    if (isConnected) {
      handleNavigateToAddData();
    } else {
      connStageActions.startConnect();
      setHasConnectFlowStarted(true);
    }
  }, [
    startOverWarningDialogDisclosure,
    gestureActions,
    resetProject,
    isConnected,
    handleNavigateToAddData,
    connStageActions,
  ]);

  useEffect(() => {
    if (status === ConnectionStatus.Connected && hasConnectFlowStarted) {
      handleNavigateToAddData();
    }
  }, [handleNavigateToAddData, hasConnectFlowStarted, status]);

  const onClickStartNewSession = useCallback(() => {
    if (hasExistingSession) {
      startOverWarningDialogDisclosure.onOpen();
    } else {
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
