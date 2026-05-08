import { Modal, ModalContent, ModalOverlay, Spinner } from "@chakra-ui/react";
import { useIntl } from "react-intl";

interface LoadingOverlayProps {
  loading: boolean;
}

const doNothing = () => {};

const LoadingOverlay = ({ loading }: LoadingOverlayProps) => {
  const intl = useIntl();
  return (
    <Modal
      isOpen={loading}
      closeOnEsc={false}
      closeOnOverlayClick={false}
      onClose={doNothing}
      isCentered
    >
      <ModalOverlay />
      <ModalContent
        bgColor="transparent"
        boxShadow="none"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner
          aria-label={intl.formatMessage({ id: "loading" })}
          thickness="16px"
          speed="2s"
          emptyColor="whitesmoke"
          color="brand.600"
          h="166px"
          w="166px"
        />
      </ModalContent>
    </Modal>
  );
};

export default LoadingOverlay;
