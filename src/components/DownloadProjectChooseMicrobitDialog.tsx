import {
  Box,
  Button,
  Heading,
  HStack,
  Icon,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
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

export interface DownloadProjectChooseMicrobitDialogProps {
  onClose: () => void;
  onSameMicrobitClick: () => void;
  onDifferentMicrobitClick: () => void;
}

type DeviceOption = "same" | "different";

const DownloadProjectChooseMicrobitDialog = ({
  onSameMicrobitClick,
  onDifferentMicrobitClick,
  onClose,
}: DownloadProjectChooseMicrobitDialogProps) => {
  const defaultValue = "same";
  const [selected, setSelected] = useState<DeviceOption>(defaultValue);
  const handleOptionChange = useCallback(
    (opt: DeviceOption) => setSelected(opt),
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
      id: "same",
      imgSrc: microbitImage,
    },
    {
      id: "different",
      imgSrc: twoMicrobitsImage,
    },
  ];
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={true}
      onClose={onClose}
      size="3xl"
      isCentered
    >
      <ModalOverlay>
        <ModalContent p={8}>
          <ModalBody>
            <ModalCloseButton />
            <VStack width="100%" alignItems="left" gap={5}>
              <Heading as="h1" fontWeight="bold" fontSize="2xl">
                <FormattedMessage id="download-project-intro-title" />
              </Heading>
              <VStack gap={5} w="full">
                <Text textAlign="left" w="full">
                  <FormattedMessage id="download-project-choose-microbit-subtitle" />
                </Text>
                <HStack
                  gap={5}
                  w="full"
                  justifyContent="space-evenly"
                  {...group}
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
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="right" px={0} pb={0}>
            <Button
              variant="primary"
              onClick={
                selected === "same"
                  ? onSameMicrobitClick
                  : onDifferentMicrobitClick
              }
            >
              <FormattedMessage id="connectMB.nextButton" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

interface RadioCardProps extends UseRadioProps {
  id: string;
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

export default DownloadProjectChooseMicrobitDialog;
