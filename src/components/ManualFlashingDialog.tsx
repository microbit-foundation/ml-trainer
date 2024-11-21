import { Button, Image, Text, VStack } from "@chakra-ui/react";
import Bowser from "bowser";
import { ReactNode, useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import transferProgramChromeOS from "../images/transfer_program_chromeos.gif";
import transferProgramMacOS from "../images/transfer_program_macos.gif";
import transferProgramWindows from "../images/transfer_program_windows.gif";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import { HexData, HexUrl } from "../model";
import { downloadHex } from "../utils/fs-util";

interface ImageProps {
  src: string;
  height: number;
}

// TODO: Update ChromeOS and Windows transfer program gif for the data collection program
// See https://github.com/lancedikson/bowser/blob/master/src/constants.js
const getImageProps = (os: string): ImageProps => {
  switch (os) {
    case "Chrome OS":
      return { src: transferProgramChromeOS, height: 401 };
    case "Windows":
      return { src: transferProgramWindows, height: 352 };
    case "macOS":
      return { src: transferProgramMacOS, height: 347 };
    default:
      return { src: transferProgramWindows, height: 392 };
  }
};

export interface ManualFlashingDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {
  hex: HexData | HexUrl;
  closeIsPrimaryAction?: boolean;
}

const ManualFlashingDialog = ({
  hex,
  closeIsPrimaryAction,
  ...props
}: ManualFlashingDialogProps) => {
  const intl = useIntl();
  const browser = Bowser.getParser(window.navigator.userAgent);
  const osName = browser.getOS().name ?? "unknown";

  const imageProps = getImageProps(osName);

  const handleDownload = useCallback(() => {
    downloadHex(hex);
  }, [hex]);

  return (
    <ConnectContainerDialog
      headingId="transfer-hex-heading"
      additionalActions={
        closeIsPrimaryAction ? (
          <Button onClick={props.onClose} variant="primary" size="lg">
            <FormattedMessage id="close-action" />
          </Button>
        ) : undefined
      }
      {...props}
    >
      <VStack gap={5} width="100%">
        <Text alignSelf="left" width="100%">
          <FormattedMessage
            id="transfer-hex-manual-download"
            values={{
              link: (chunks: ReactNode) => (
                <Button variant="link" onClick={handleDownload}>
                  {chunks}
                </Button>
              ),
            }}
          />
        </Text>
        <Text alignSelf="left" width="100%">
          <FormattedMessage id="transfer-hex-message" />
        </Text>
        <Image
          height={imageProps.height}
          src={imageProps.src}
          alt={intl.formatMessage({ id: "transfer-hex-alt" })}
          mb={5}
        />
      </VStack>
    </ConnectContainerDialog>
  );
};

export default ManualFlashingDialog;
