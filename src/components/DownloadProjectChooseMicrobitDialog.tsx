import {
  Box,
  HStack,
  Icon,
  Image,
  Text,
  useRadio,
  UseRadioProps,
  VStack,
} from "@chakra-ui/react";
import { RiCheckboxBlankLine } from "react-icons/ri";
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
        <HStack gap={5} w="full" justifyContent="space-evenly">
          <RadioCard
            titleId="download-project-same-microbit-option"
            onClick={onSameMicrobitClick}
            imgSrc={microbitImage}
          />
          <RadioCard
            titleId="download-project-another-microbit-option"
            onClick={onDifferentMicrobitClick}
            imgSrc={twoMicrobitsImage}
          />
        </HStack>
      </VStack>
    </ConnectContainerDialog>
  );
};

interface RadioCardProps extends UseRadioProps {
  // children: ReactNode;
  onClick: () => void;
  titleId: string;
  imgSrc: string;
}

const RadioCard = ({ titleId, imgSrc, ...props }: RadioCardProps) => {
  const { getInputProps, getRadioProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getRadioProps();

  return (
    <Box as="label">
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        borderWidth="2px"
        borderRadius="md"
        _checked={{
          borderWidth: "5px",
          borderColor: "brand.600",
        }}
        _focus={{
          boxShadow: "outline",
        }}
        p={4}
      >
        <HStack justifyContent="right" mb={-8}>
          <Icon as={RiCheckboxBlankLine} boxSize={6} color="brand.600" />
        </HStack>
        <VStack>
          <Image
            src={imgSrc}
            alt=""
            htmlWidth="220px"
            px={12}
            py={3}
            position="relative"
            justifySelf="center"
          />
          <Text fontWeight="bold" fontSize="md" w="full">
            <FormattedMessage id={titleId} />
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default DownloadProjectChooseMicrobitDialog;
