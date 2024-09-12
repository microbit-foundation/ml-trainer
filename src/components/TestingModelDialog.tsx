import {
  AspectRatio,
  Button,
  Heading,
  HStack,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useSettings } from "../settings";
import testHelpImage1 from "../images/test-help-image-1.png";
import testHelpImage2 from "../images/test-help-image-2.gif";
import testHelpImage3 from "../images/test-help-image-3.png";

interface TestingModelDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const TestingModelDialog = ({ isOpen, onClose }: TestingModelDialogProps) => {
  const [settings, setSettings] = useSettings();
  const handleCloseDontShowAgain = useCallback(() => {
    setSettings({
      ...settings,
      showTestModelHelp: false,
    });
    onClose();
  }, [onClose, setSettings, settings]);

  const [step, setStep] = useState(1);
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      isCentered
    >
      <ModalOverlay>
        <ModalContent p={8}>
          <ModalBody>
            <ModalCloseButton />
            <VStack width="100%" alignItems="left" gap={5}>
              <Heading as="h1" fontWeight="bold" fontSize="2xl">
                {/* <FormattedMessage id="content.trainer.header" /> */}
                How to test your model
              </Heading>
              <VStack gap={5} align="items-start">
                {step === 1 && (
                  <>
                    <Text textAlign="left">
                      Try performing your actions to see if the model can
                      recognise them. The estimated action is indicated by the
                      action with the green icon and certainty meter.
                    </Text>
                    <AspectRatio ratio={560 / 261} w="full">
                      <Image src={testHelpImage1} />
                    </AspectRatio>
                  </>
                )}
                {step === 2 && (
                  <>
                    <Text textAlign="left">
                      Try adjusting the recognition point for each action to
                      improve the results.
                    </Text>
                    <AspectRatio ratio={560 / 247} w="full">
                      <Image src={testHelpImage2} />
                    </AspectRatio>
                  </>
                )}
                {step === 3 && (
                  <>
                    <Text textAlign="left">
                      Use MakeCode to write a program that uses these actions.
                      When the MakeCode program is loaded onto your micro:bit,
                      it will be able to detect your actions away from the
                      computer.
                    </Text>
                    <AspectRatio ratio={560 / 247} w="full">
                      <Image src={testHelpImage3} />
                    </AspectRatio>
                  </>
                )}
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="space-between" px={0} pb={0}>
            <Button variant="link" onClick={handleCloseDontShowAgain}>
              <FormattedMessage id="dont-show-again" />
            </Button>
            <HStack gap={5}>
              {step > 1 && (
                <Button variant="secondary" onClick={() => setStep(step - 1)}>
                  <FormattedMessage id="back-action" />
                </Button>
              )}
              {step < 3 && (
                <Button variant="primary" onClick={() => setStep(step + 1)}>
                  <FormattedMessage id="connectMB.nextButton" />
                </Button>
              )}
              {step === 3 && (
                <Button variant="primary" onClick={onClose}>
                  Get testing
                </Button>
              )}
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default TestingModelDialog;
