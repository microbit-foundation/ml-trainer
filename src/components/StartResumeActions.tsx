import { Button, HStack, StackProps, useDisclosure } from "@chakra-ui/react";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import { useConnectionStage } from "../connection-stage-hooks";
import { SessionPageId } from "../pages-config";
import { useHasGestures, useStore } from "../store";
import { createSessionPageUrl } from "../urls";
import StartOverWarningDialog from "./StartOverWarningDialog";

const StartResumeActions = ({ ...props }: Partial<StackProps>) => {
  const newSession = useStore((s) => s.newSession);
  const hasExistingSession = useHasGestures();
  const startOverWarningDialogDisclosure = useDisclosure();
  const navigate = useNavigate();
  const { actions: connStageActions } = useConnectionStage();

  const handleNavigateToAddData = useCallback(() => {
    navigate(createSessionPageUrl(SessionPageId.DataSamples));
  }, [navigate]);

  const handleStartNewSession = useCallback(() => {
    startOverWarningDialogDisclosure.onClose();
    newSession();
    handleNavigateToAddData();
    connStageActions.startConnect();
  }, [
    startOverWarningDialogDisclosure,
    newSession,
    handleNavigateToAddData,
    connStageActions,
  ]);

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
