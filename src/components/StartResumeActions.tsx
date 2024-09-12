import { Button, HStack, StackProps, useDisclosure } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import { createSessionPageUrl } from "../urls";
import StartOverWarningDialog from "./StartOverWarningDialog";
import { useConnectionStage } from "../connection-stage-hooks";
import { ConnectionStatus } from "../connect-status-hooks";
import { SessionPageId } from "../pages-config";
import { useAppStore, useHasGestures } from "../store";

const StartResumeActions = ({ ...props }: Partial<StackProps>) => {
  const newSession = useAppStore((s) => s.newSession);
  const hasExistingSession = useHasGestures();
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
    navigate(createSessionPageUrl(SessionPageId.DataSamples));
  }, [navigate]);

  const handleStartNewSession = useCallback(() => {
    startOverWarningDialogDisclosure.onClose();
    newSession();
    if (isConnected) {
      handleNavigateToAddData();
    } else {
      connStageActions.startConnect();
      setHasConnectFlowStarted(true);
    }
  }, [
    startOverWarningDialogDisclosure,
    newSession,
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
