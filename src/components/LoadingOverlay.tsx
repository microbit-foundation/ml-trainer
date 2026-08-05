import { Modal, Spinner } from "@microbit/ui";
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
      isKeyboardDismissDisabled
      isDismissable={false}
      onClose={doNothing}
      isCentered
      contentCss={{
        background: "transparent",
        boxShadow: "none",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Spinner
        aria-label={intl.formatMessage({ id: "loading" })}
        speed="2s"
        css={{
          width: "166px",
          height: "166px",
          borderWidth: "16px",
          color: "brand.600",
          borderBottomColor: "gray.75",
          borderLeftColor: "gray.75",
        }}
      />
    </Modal>
  );
};

export default LoadingOverlay;
