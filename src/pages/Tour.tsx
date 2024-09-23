import {
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
  usePopper,
  useToken,
} from "@chakra-ui/react";
import { useCallback, useEffect, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { useStore } from "../store";
import { tours } from "../tours";
import TourOverlay from "./TourOverlay";

const Tour = () => {
  const tourState = useStore((s) => s.tourState);
  const steps = tourState ? tours[tourState.id] : undefined;
  const step = tourState && steps ? steps[tourState.index] : undefined;

  const tourNext = useStore((s) => s.tourNext);
  const tourBack = useStore((s) => s.tourBack);
  const tourComplete = useStore((s) => s.tourComplete);
  const tourCancel = useStore((s) => s.tourCancel);
  const isOpen = !!tourState;
  const enabled = isOpen && !!step?.selector;
  const {
    getArrowProps,
    getArrowInnerProps,
    getPopperProps,
    referenceRef,
    update,
  } = usePopper({
    enabled,
  });
  const ourRef = useRef<HTMLElement>();

  const handleTourComplete = useCallback(() => {
    if (!tourState) {
      throw new Error("Must be a tour");
    }
    tourComplete(tourState.id);
  }, [tourComplete, tourState]);

  useEffect(() => {
    if (!step?.selector) {
      referenceRef(null);
      ourRef.current = undefined;
    } else {
      const element = document.querySelector(step.selector) as HTMLElement;
      referenceRef(element);
      ourRef.current = element;
    }
    update();
  }, [referenceRef, step?.selector, tourState, update]);

  const shadow = useToken("shadows", "none");
  if (!tourState || !steps || !step) {
    return null;
  }
  const { index } = tourState;
  const hasBack = index > 0;
  const isLastStep = index === steps.length - 1;

  const popperProps = getPopperProps();
  const contentProps = enabled ? popperProps : { ref: popperProps.ref };
  return (
    <Modal key={step.selector} isOpen={isOpen} onClose={tourCancel}>
      <ModalContent {...contentProps} motionProps={{}} boxShadow="none">
        {step.selector && (
          <Box
            {...getArrowProps()}
            className="chakra-popover__arrow-positioner"
          >
            <Box
              className="chakra-popover__arrow"
              {...getArrowInnerProps()}
              __css={{
                "--popper-arrow-shadow-color": "grey",
                "--popper-arrow-bg": "white",
                "--popper-arrow-shadow": shadow,
              }}
            />
          </Box>
        )}
        <TourOverlay referenceRef={ourRef} padding={step.spotlightPadding} />
        <ModalHeader>{step.title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>{step.content}</ModalBody>
        <ModalFooter>
          <HStack justifyContent="space-between" p={0} w="full">
            <Text>
              Step {index + 1} of {steps.length}
            </Text>
            <HStack gap={2}>
              {hasBack && (
                <Button variant="secondary" size="sm" onClick={tourBack}>
                  <FormattedMessage id="back-action" />
                </Button>
              )}
              {isLastStep ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleTourComplete}
                >
                  <FormattedMessage id="close-action" />
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={tourNext}>
                  <FormattedMessage id="connectMB.nextButton" />
                </Button>
              )}
            </HStack>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default Tour;
