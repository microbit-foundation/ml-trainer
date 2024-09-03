import { HStack, Image, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import microbitImage from "../images/stylised-microbit-black.svg";
import twoMicrobitsImage from "../images/stylised-two-microbits-black.svg";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";

export interface DownloadProjectChooseMicrobitDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {
  onSameMicrobitClick: () => void;
  onDifferentMicrobitClick: () => void;
}

const DownloadProjectChooseMicrobitDialog = ({
  onSameMicrobitClick,
  onDifferentMicrobitClick,
  ...props
}: DownloadProjectChooseMicrobitDialogProps) => {
  return (
    <ConnectContainerDialog
      headingId="download-project-choose-microbit-title"
      {...props}
    >
      <VStack gap={5} w="full">
        <Text textAlign="left" w="full">
          <FormattedMessage id="download-project-choose-microbit-subtitle" />
        </Text>
        <HStack gap={5}>
          <Option
            titleId="download-project-same-microbit-option"
            onClick={onSameMicrobitClick}
            imgSrc={microbitImage}
          />
          <Option
            titleId="download-project-another-microbit-option"
            onClick={onDifferentMicrobitClick}
            imgSrc={twoMicrobitsImage}
          />
        </HStack>
      </VStack>
    </ConnectContainerDialog>
  );
};

interface OptionProps {
  onClick: () => void;
  titleId: string;
  imgSrc: string;
}

const Option = ({ onClick, titleId, imgSrc }: OptionProps) => {
  return (
    <VStack
      bgColor="white"
      borderRadius="5px"
      overflow="hidden"
      maxW="450px"
      w="50%"
      borderStyle="solid"
      borderColor="gray.200"
      borderWidth="5px"
      _hover={{ bgColor: "gray.200" }}
      transition="background-color 0.25s"
      p={3}
      gap={3}
      alignItems="stretch"
      onClick={onClick}
    >
      <Text fontWeight="bold" fontSize="md" w="full" textAlign="center">
        <FormattedMessage id={titleId} />
      </Text>
      <Image src={imgSrc} alt="" htmlWidth="400px" px={10} py={3} />
    </VStack>
  );
};

export default DownloadProjectChooseMicrobitDialog;
