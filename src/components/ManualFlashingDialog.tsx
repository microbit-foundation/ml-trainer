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

interface HexFile {
  type: "url" | "data";
  source: string;
  name: string;
}

export interface ManualFlashingDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {
  hexFile: HexFile;
}

const download = (hexFile: HexFile) => {
  if (hexFile.type === "url") {
    return downloadFileUrl(hexFile.source, hexFile.name);
  }
  downloadHex(hexFile.source, hexFile.name);
};

const downloadFileUrl = (fileUrl: string, filename: string) => {
  const a = document.createElement("a");
  a.download = filename;
  a.href = fileUrl;
  a.click();
  a.remove();
};

const downloadHex = (hex: string, filename: string) => {
  const a = document.createElement("a");
  a.setAttribute(
    "href",
    "data:application/text;charset=utf-8," + encodeURIComponent(hex)
  );
  a.setAttribute("download", filename);
  a.style.display = "none";
  a.click();
  a.remove();
};

const ManualFlashingDialog = ({
  hexFile,
  ...props
}: ManualFlashingDialogProps) => {
  const intl = useIntl();
  const browser = Bowser.getParser(window.navigator.userAgent);
  const osName = browser.getOS().name ?? "unknown";

  const imageProps = getImageProps(osName);

  const handleDownload = useCallback(() => {
    download(hexFile);
  }, [hexFile]);

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
