import { Image, Text, VStack } from "@chakra-ui/react";
import Bowser from "bowser";
import { ReactNode, useCallback, useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import transferProgramChromeOS from "../images/transfer_program_chromeos.gif";
import transferProgramMacOS from "../images/transfer_program_macos.gif";
import transferProgramWindows from "../images/transfer_program_windows.gif";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import { HexType, getHexFileUrl } from "../device/get-hex-file";

interface ImageProps {
  src: string;
  height: number;
}

// See https://github.com/lancedikson/bowser/blob/master/src/constants.js
const getImageProps = (os: string): ImageProps => {
  switch (os) {
    case "Chrome OS":
      return { src: transferProgramChromeOS, height: 300 };
    case "Windows":
      return { src: transferProgramWindows, height: 362 };
    case "macOS":
      return { src: transferProgramMacOS, height: 360 };
    default:
      return { src: transferProgramWindows, height: 392 };
  }
};

export interface ManualFlashingDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {}

const download = (data: string, filename: string) => {
  const a = document.createElement("a");
  a.download = filename;
  a.href = URL.createObjectURL(new Blob([data], { type: "text/csv" }));
  a.click();
  a.remove();
};

// Only bluetooth mode has this fallback, the radio bridge mode requires working WebUSB.
const ManualFlashingDialog = ({ ...props }: ManualFlashingDialogProps) => {
  const intl = useIntl();
  const browser = Bowser.getParser(window.navigator.userAgent);
  const osName = browser.getOS().name ?? "unknown";

  const imageProps = getImageProps(osName);

  const handleDownload = useCallback(() => {
    download(
      getHexFileUrl("universal", HexType.Bluetooth)!,
      "machine-learning-tool-program.hex"
    );
  }, []);

  useEffect(() => {
    handleDownload();
  }, [handleDownload]);

  return (
    <ConnectContainerDialog
      headingId="connectMB.transferHex.heading"
      {...props}
    >
      <VStack gap={5} width="100%">
        <Text alignSelf="left" width="100%">
          <FormattedMessage id="connectMB.connectBattery.subtitle" />{" "}
          <FormattedMessage
            id="connectMB.transferHex.manualDownload"
            values={{
              link: (chunks: ReactNode) => (
                <Text as="button" color="purple.500" onClick={handleDownload}>
                  {chunks}
                </Text>
              ),
            }}
          />
        </Text>
        <Text alignSelf="left" width="100%">
          <FormattedMessage id="connectMB.transferHex.message" />
        </Text>
        <Image
          height={imageProps.height}
          src={imageProps.src}
          alt={intl.formatMessage({ id: "connectMB.transferHex.altText" })}
          mb={5}
        />
      </VStack>
    </ConnectContainerDialog>
  );
};

export default ManualFlashingDialog;
