import {
  Box,
  HStack,
  Icon,
  Image,
  Text,
  useRadio,
  useRadioGroup,
  UseRadioProps,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { RiCheckboxBlankLine, RiCheckboxFill } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import microbitImage from "../images/stylised-microbit-black.svg";
import twoMicrobitsImage from "../images/stylised-two-microbits-black.svg";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";
import { DownloadState, MicrobitToFlash } from "../model";

export interface DownloadChooseMicrobitDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {
  onSameMicrobitClick: () => void;
  onDifferentMicrobitClick: () => void;
  stage: DownloadState;
}

type MicrobitOption = MicrobitToFlash.Same | MicrobitToFlash.Different;

const DownloadChooseMicrobitDialog = ({
  onSameMicrobitClick,
  onDifferentMicrobitClick,
  stage,
  ...props
}: DownloadChooseMicrobitDialogProps) => {
  const defaultValue =
    stage.microbitToFlash === MicrobitToFlash.Default
      ? MicrobitToFlash.Same
      : stage.microbitToFlash;
  const [selected, setSelected] = useState<MicrobitOption>(defaultValue);
  const handleOptionChange = useCallback(
    (opt: MicrobitOption) => setSelected(opt),
    []
  );
  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "chosenDevice",
    defaultValue,
    onChange: handleOptionChange,
  });
  const group = getRootProps();
  const radioCardOptions: Omit<RadioCardProps, "isSelected">[] = [
    {
      id: MicrobitToFlash.Same,
      imgSrc: microbitImage,
    },
    {
      id: MicrobitToFlash.Different,
      imgSrc: twoMicrobitsImage,
    },
  ];
  return (
    <ConnectContainerDialog
      {...props}
      onNextClick={
        selected === MicrobitToFlash.Same
          ? onSameMicrobitClick
          : onDifferentMicrobitClick
      }
      headingId="download-project-choose-microbit-title"
    >
      <VStack gap={5} w="full">
        <Text textAlign="left" w="full">
          <FormattedMessage id="download-project-choose-microbit-subtitle" />
        </Text>
        <HStack
          gap={5}
          w="full"
          justifyContent="space-evenly"
          {...group}
          mb={3}
        >
          {radioCardOptions.map((config) => {
            const radio = getRadioProps({ value: config.id });
            return (
              <RadioCard
                key={config.id}
                {...radio}
                {...config}
                isSelected={selected === config.id}
              />
            );
          })}
        </HStack>
      </VStack>
    </ConnectContainerDialog>
  );
};

interface RadioCardProps extends UseRadioProps {
  id: MicrobitOption;
  imgSrc: string;
  isSelected: boolean;
}

const RadioCard = ({ id, imgSrc, isSelected, ...props }: RadioCardProps) => {
  const { getInputProps, getRadioProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getRadioProps();

  return (
    <Box as="label">
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        borderWidth="5px"
        borderRadius="md"
        borderColor="gray.500"
        _checked={{
          borderWidth: "5px",
          borderColor: "brand.600",
        }}
        _focus={{
          boxShadow: "outline",
        }}
        p={4}
      >
        <HStack justifyContent="right" mb={-7} mt={-1} mr={-1}>
          {isSelected ? (
            <Icon as={RiCheckboxFill} boxSize={6} color="brand.600" />
          ) : (
            <Icon as={RiCheckboxBlankLine} boxSize={6} color="gray.500" />
          )}
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
            <FormattedMessage id={`download-project-${id}-microbit-option`} />
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default DownloadChooseMicrobitDialog;
