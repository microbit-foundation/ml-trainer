import {
  AspectRatio,
  Box,
  Button,
  Grid,
  Heading,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Stack,
  Text,
  useDisclosure,
  useMergeRefs,
  usePopper,
  VStack,
} from "@chakra-ui/react";
import { useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import DefaultPageLayout from "../components/DefaultPageLayout";
import ResourceCard from "../components/ResourceCard";
import StartResumeActions from "../components/StartResumeActions";
import addDataImage from "../images/add_data.svg";
import testModelImage from "../images/test_model_blue.svg";
import trainModelImage from "../images/train_model_blue.svg";
import { resourcesConfig } from "../pages-config";
import TourModalArrow from "./TourModalArrow";
import TourOverlay from "./TourOverlay";

type StepId = "add-data" | "train-model" | "test-model";

interface StepConfig {
  id: StepId;
  imgSrc: string;
}

const stepsConfig: StepConfig[] = [
  {
    id: "add-data",
    imgSrc: addDataImage,
  },
  {
    id: "train-model",
    imgSrc: trainModelImage,
  },
  {
    id: "test-model",
    imgSrc: testModelImage,
  },
];

const HomePage = () => {
  const intl = useIntl();
  const d = useDisclosure();
  const r = useRef<HTMLElement>(null);
  const {
    referenceRef,
    getPopperProps,
    getReferenceProps,
    getArrowProps,
    getArrowInnerProps,
  } = usePopper({
    enabled: d.isOpen,
  });
  const mR = useMergeRefs(r, referenceRef);
  return (
    <DefaultPageLayout titleId="content.index.title" showOpenButton>
      <VStack
        gap={10}
        maxW="75rem"
        mx="auto"
        p={10}
        justifyContent="flex-start"
      >
        <Box>
          <Modal isOpen={d.isOpen} onClose={d.onClose}>
            <ModalContent
              {...getPopperProps()}
              motionProps={{}}
              boxShadow="none"
            >
              <TourModalArrow
                outer={getArrowProps()}
                inner={getArrowInnerProps()}
              />
              <TourOverlay referenceRef={r} />
              <ModalHeader>Modal Title</ModalHeader>
              <ModalCloseButton />
              <ModalBody>Hi</ModalBody>

              <ModalFooter>
                <Button colorScheme="blue" mr={3} onClick={d.onClose}>
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Box>
        <VStack justifyItems="center" justify="center" gap={5}>
          <Heading as="h1" fontSize="4xl" fontWeight="bold">
            <FormattedMessage id="homepage-title" />
          </Heading>
          <Text fontSize="xl">
            <FormattedMessage id="homepage-subtitle" />
          </Text>
        </VStack>
        <VStack width="100%" alignItems="center">
          <Stack
            width="100%"
            direction={{ base: "column", lg: "row" }}
            justify="space-between"
            px={10}
            gap={5}
          >
            {stepsConfig.map(({ id, imgSrc }, idx) => (
              <Step
                key={id}
                title={`${idx + 1}. ${intl.formatMessage({
                  id: `${id}-title`,
                })}`}
                imgSrc={imgSrc}
                description={intl.formatMessage({
                  id: `${id}-intro-description`,
                })}
              />
            ))}
          </Stack>
        </VStack>

        <Heading
          as="h2"
          fontSize="3xl"
          px={10}
          alignSelf={{ base: "center", lg: "start" }}
          fontWeight="bold"
        >
          <FormattedMessage id="resources" />
        </Heading>
        <Button
          onClick={() => {
            d.onOpen();
          }}
          {...getReferenceProps()}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
          ref={mR as any}
        >
          Open
        </Button>
        <Grid
          templateColumns={{ base: "repeat(1, 1fr)", lg: "repeat(3, 1fr)" }}
          px={10}
          gap={5}
        >
          {resourcesConfig.map((r, idx) => (
            <ResourceCard {...r} key={idx} />
          ))}
        </Grid>
        <StartResumeActions />
      </VStack>
    </DefaultPageLayout>
  );
};

interface StepProps {
  title: string;
  imgSrc: string;
  description: string;
}

const Step = ({ title, imgSrc, description }: StepProps) => (
  <VStack justifyItems="center" alignItems="center" maxW="18rem" gap="1rem">
    <Heading as="h3" textAlign="center" fontSize="2xl" fontWeight="bold">
      {title}
    </Heading>
    <AspectRatio ratio={288 / 172} width="full">
      <Image src={imgSrc} alt="" />
    </AspectRatio>
    <Text textAlign="center">{description}</Text>
  </VStack>
);

export default HomePage;
