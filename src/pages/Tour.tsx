import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  usePopper,
  useToken,
} from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import TourOverlay from "./TourOverlay";

const Tour = () => {
  const [isOpen, setOpen] = useState(false);
  const {
    getArrowProps,
    getArrowInnerProps,
    getPopperProps,
    referenceRef,
    update,
  } = usePopper({
    enabled: isOpen,
  });
  const ourRef = useRef<HTMLElement>();

  const handleStep = useCallback(() => {
    const element = document.querySelector(".foof") as HTMLElement;
    referenceRef(element);
    ourRef.current = element;
    update();
    setOpen(true);
  }, [referenceRef, update]);
  useEffect(() => {
    handleStep();
  }, [handleStep]);

  return (
    <Modal isOpen={isOpen} onClose={() => setOpen(false)}>
      <ModalContent {...getPopperProps()} motionProps={{}} boxShadow="none">
        <Box {...getArrowProps()} className="chakra-popover__arrow-positioner">
          <Box
            className="chakra-popover__arrow"
            {...getArrowInnerProps()}
            __css={{
              "--popper-arrow-shadow-color": "grey",
              "--popper-arrow-bg": "white",
              "--popper-arrow-shadow": useToken("shadows", "none"),
            }}
          />
        </Box>
        <TourOverlay referenceRef={ourRef} />
        <ModalHeader>Modal Title</ModalHeader>
        <ModalCloseButton />
        <ModalBody>Hi</ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={() => {
              setOpen(false);
            }}
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default Tour;
