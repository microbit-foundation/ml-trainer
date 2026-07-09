import { Modal, Spinner } from "../shared-ui";
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
        css={{
          width: "166px",
          height: "166px",
          borderWidth: "16px",
          color: "brand.600",
          borderBottomColor: "whitesmoke",
          borderLeftColor: "whitesmoke",
          animationDuration: "2s",
        }}
      />
    </Modal>
  );
};

export default LoadingOverlay;
