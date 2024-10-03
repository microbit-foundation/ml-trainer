import {
  AspectRatio,
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Image,
  Stack,
  Text,
  useInterval,
  VStack,
} from "@chakra-ui/react";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import DefaultPageLayout from "../components/DefaultPageLayout";
import ResourceCard from "../components/ResourceCard";
import ResourceCardPlaceholder from "../components/ResourceCardPlaceholder";
import YoutubeVideoEmbed from "../components/YoutubeVideoEmbed";
import blockImage from "../images/block.png";
import xyzGraph from "../images/xyz-graph.png";
import { SessionPageId } from "../pages-config";
import { createSessionPageUrl } from "../urls";
import PercentageMeter from "../components/PercentageMeter";
import PercentageDisplay from "../components/PercentageDisplay";
import { ArrowDownIcon } from "@chakra-ui/icons";
import RecordingGraph from "../components/RecordingGraph";

const graphData = {
  x: [
    0.4, 0.152, -0.008, 0.056, -0.324, 1.604, 2.04, 0.92, 1.844, 1.872, 2.04,
    2.04, 2.04, 2.04, 0.196, -1.004, 0.928, 0.624, -0.052, -0.38, 0.08, -0.136,
    0.156, 0.316, -0.264, -0.28, 2.04, 2.04, 1.896, 2.04, 2.04, 2.04, 2.04,
    2.04, 1.484, -0.408, -0.424, 0.988, 0.412, -0.528, -0.568, 0.428, 0.44,
    0.364, 0.004, -0.028, -0.304, 2.04, 2.004, 0.98, 2.04, 2.04, 1.368, 2.04,
    2.04, 1.472, -1.328, 0.4, 0.904, -0.392, -0.2, 0.06, -0.044, -0.172, 0.076,
    -0.044, -0.316, 0.692, 2.04, 2.04, 2.04, 1.148, 1.1, 2.04, 2.04, 2.04,
    0.952, -0.68, 0.032, 0.48, -0.08, -0.068, 0.024, 0.336, 0.204, -0.1, -0.244,
    0.04, 1.168,
  ],
  y: [
    -0.752, -1.192, -1.212, -1.456, -0.972, -0.42, 0.292, 1.68, 0.544, -0.66,
    -1.148, -0.224, -0.784, -1.196, -0.888, 0.472, 1.172, -0.776, -0.86, 0.476,
    0.324, 0.228, 0.576, 0.68, 0.904, 0.708, -0.9, 0.02, 0.752, 0.424, -1.012,
    -0.44, -0.144, -0.032, -0.072, 0.764, 1.228, 0.872, 0.436, 0.616, 0.324,
    0.26, -0.416, -1.748, -2.04, -1.036, 0.596, 0.788, 0.46, 0.02, 0.676,
    -1.332, -1.112, -0.48, -0.548, -1.16, 0.516, 0.264, -0.72, -0.8, 0.488,
    0.868, 0.836, 0.404, 0.36, 0.276, 0.244, 0.348, 0.88, 1.468, -0.596, -1.248,
    -0.864, 0.068, -0.512, 0.092, 0.592, -0.024, 1.008, 0.432, 0.508, 0.76,
    0.568, 0.14, -0.348, -1.192, -1.528, -1.496, 0.38,
  ],
  z: [
    -0.408, -0.152, 0.06, -0.044, 2.04, -0.7, -1.548, 0.58, 0.62, 0.932, 0.764,
    0.408, 0.132, -1.004, 0.324, 2.04, 1.156, 0.156, 0.076, -0.232, -0.244,
    0.036, 0.056, 0.024, 1.044, 2.04, -2.012, 0.644, -0.44, 0.42, 0.672, 0.604,
    0.132, -0.432, 0, 1.176, 2.04, 0.152, 0.04, -0.544, 0.072, 0.116, 0.208,
    0.868, 0.816, 0.324, 2.04, -2.04, 1.536, -0.044, 0.444, 0.552, 0.784,
    -0.004, -0.604, -0.008, 2.04, 1.764, 0.044, 0.068, -0.02, -0.052, -0.052,
    0.024, -0.196, 0.28, 2.04, 0.704, -0.576, 0.432, 0.788, 0.88, 0.872, 0.22,
    0.288, -0.516, 0.348, 2.04, 1.892, 0.12, -0.04, -0.464, -0.104, -0.088,
    -0.084, 0.22, 0.74, 2.04, -0.096,
  ],
};

const HomePage = () => {
  const navigate = useNavigate();
  const handleGetStarted = useCallback(() => {
    // This isn't right, need existing session etc.
    navigate(createSessionPageUrl(SessionPageId.DataSamples));
  }, [navigate]);
  return (
    <DefaultPageLayout
      toolbarItemsRight={
        <Button variant="toolbar" onClick={handleGetStarted}>
          Get started
        </Button>
      }
    >
      <Container centerContent gap={16} p={8} maxW="container.lg">
        <HStack
          gap={5}
          flexDir={{ base: "column", lg: "row" }}
          w={{ base: "100%", lg: "unset" }}
        >
          <VStack
            flex="1"
            alignItems="flex-start"
            gap={5}
            w={{ base: "100%", lg: "unset" }}
          >
            <Heading as="h1" fontSize="4xl" fontWeight="bold">
              <FormattedMessage id="homepage-title" />
            </Heading>
            <Text fontSize="md" fontWeight="bold">
              Create AI on your BBC micro:bit using movement and machine
              learning
            </Text>
            <Text fontSize="md">
              Train a machine learning model on your own movement data.
            </Text>
            <Text fontSize="md">
              Add code to use your model in real-world projects.
            </Text>
            <Button
              size="lg"
              variant="primary"
              onClick={handleGetStarted}
              mt={5}
            >
              Get started
            </Button>
          </VStack>
          <Box flex="1" position="relative">
            <Image src={xyzGraph} borderRadius="md" bgColor="white" pr={1} />
          </Box>
        </HStack>
        <VStack spacing={8} w="100%" maxW="container.md">
          <Heading as="h2" textAlign="center">
            How it works
          </Heading>
          <Box w="100%">
            <YoutubeVideoEmbed
              youtubeId="ZhUtuuQemFc"
              alt="Introductory video"
            />
          </Box>
          <Text fontSize="md">
            Watch the video to learn how to use the micro:bit AI creator.
          </Text>
        </VStack>
        <VStack gap={8}>
          <Heading as="h2" textAlign="center">
            Step by step
          </Heading>
          <VStack gap={12} maxW="container.md" position="relative">
            <Step
              title="Collect data"
              image={<CollectDataIllustration />}
              description="Connect a micro:bit to collect data samples of the actions you would like your model to recognise (e.g. ‘waving’ and ‘clapping’)."
            />
            <HStack gap={5} position="absolute" right="-150px" top="60px">
              <Box as="svg" w={20} viewBox="0 0 201 402">
                <path
                  d="M1.924 38.711C8.044 30.755 17.836 19.127 18.448 8.723C19.06 3.215 22.732 1.991 25.792 2.603C26.404 1.379 27.628 0.766998 28.852 0.766998C200.212 10.559 284.056 345.936 82.708 364.295C83.32 364.907 83.932 366.131 83.932 367.356C83.932 377.148 83.932 386.328 83.932 396.12C83.932 399.792 80.26 402.852 76.588 401.628C45.376 390.612 25.18 367.968 4.372 343.488C1.312 340.428 2.536 336.144 5.596 333.696C23.344 320.844 41.092 308.604 57.004 293.916C61.288 289.632 67.408 292.692 68.02 298.2C68.632 306.768 70.468 315.336 71.692 323.904C132.892 320.843 155.536 257.808 153.088 202.728C150.64 122.555 74.14 76.043 6.82001 51.563C3.76001 50.339 2.536 47.279 2.536 44.831C0.7 43.607 0.0880008 41.159 1.924 38.711ZM167.164 202.728C172.06 266.988 137.176 339.204 65.572 337.368C61.9 337.368 59.452 334.308 58.84 330.636C58.228 323.905 57.004 317.172 56.392 311.052C44.152 321.456 30.688 330.636 17.224 340.429C32.524 359.401 49.048 377.149 71.692 387.552C71.692 380.821 71.692 374.7 71.692 367.968C71.692 366.132 72.304 364.296 73.528 363.685C71.08 361.237 71.692 355.729 75.976 355.117C116.368 346.549 150.64 331.249 171.448 293.305C191.032 257.809 189.808 213.744 181.24 175.801C164.716 99.911 109.636 26.471 31.3 9.947C31.3 10.559 30.688 11.783 30.076 13.007C25.792 18.515 23.344 25.247 19.06 30.755C16.612 34.427 13.552 37.487 10.492 40.547C88.216 59.519 160.432 121.331 167.164 202.728Z"
                  fill="black"
                />
              </Box>
              <Text fontWeight="bold" fontSize="xl">
                Train
              </Text>
            </HStack>
            <HStack gap={5} position="absolute" left="-170px" top="60px">
              <Text fontWeight="bold" fontSize="xl">
                Iterate
              </Text>
              <Box as="svg" width={20} viewBox="0 0 187 390">
                <path
                  d="M123.353 31.9473C126.413 22.1553 130.084 12.3633 133.757 3.18325C135.593 -0.488749 141.101 -1.10075 144.16 1.95925C160.072 18.4833 172.312 38.0672 185.776 56.4272C187 58.2632 187 61.3233 185.776 63.1593C174.76 78.4593 161.908 91.3113 146.608 102.327C142.936 104.775 138.04 101.715 136.816 98.0433C134.368 91.3113 133.144 84.5793 132.532 77.8473C68.272 96.2073 45.016 158.019 51.136 221.055C54.196 251.655 65.824 282.254 85.407 305.51C107.439 331.826 130.083 331.214 160.683 336.111C162.519 336.723 163.743 337.947 164.355 339.783C166.803 340.395 169.251 342.231 169.863 345.903C170.475 355.695 169.863 365.487 169.251 375.279C169.251 375.891 169.251 377.115 168.64 377.727C172.924 378.951 173.536 386.907 168.64 387.519C-19.855 419.955 -69.428 27.0513 123.353 31.9473ZM158.849 376.503C158.849 375.892 158.237 375.279 158.237 374.056C157.625 365.488 157.625 356.308 157.625 347.127C131.921 355.083 101.321 337.947 82.962 321.423C57.258 297.556 44.405 260.835 38.898 227.175C27.882 158.019 57.258 77.2363 134.37 66.8313H134.982C138.654 63.1593 146.61 64.9952 146.61 71.7272C146.61 76.6232 147.222 80.9073 147.834 84.5793C158.238 76.6233 174.763 61.9353 171.702 58.2633C161.91 44.7993 152.118 30.7233 141.102 17.8713C138.041 23.9913 134.982 30.1113 131.922 36.2313C131.31 37.4553 130.697 38.0673 130.085 38.6793C130.085 42.3513 128.249 46.0233 123.354 46.0233C34.001 43.5753 11.358 141.495 18.09 213.711C25.433 293.883 73.168 375.279 158.849 376.503Z"
                  fill="black"
                />
              </Box>
            </HStack>
            <Step
              title="Test model"
              image={<TestModelStepIllustration />}
              description={
                "Try each action by moving your data collection micro:bit. Does the model detect your actions? Go back to add more data to improve your model."
              }
            />
            <Step
              title="Code"
              image={<CodeIllustration />}
              description={
                "Use Microsoft MakeCode to download the program and machine learning model to your micro:bit. Add more blocks to create your own program using your model."
              }
            />
          </VStack>
        </VStack>
        <VStack gap={8}>
          <Heading as="h2" textAlign="center">
            Projects
          </Heading>
          <HStack gap={5} flexDir={{ base: "column", lg: "row" }}>
            <ResourceCard
              title="Simple AI activity timer"
              url="https://www.example.com"
              imgSrc="https://cdn.sanity.io/images/ajwvhvgo/production/1aaac1553237900c774216aad17475ef34f8fe48-800x600.jpg?fit=max&w=1200&h=1200"
            />
            <ResourceCardPlaceholder />
          </HStack>
        </VStack>
      </Container>
    </DefaultPageLayout>
  );
};

interface StepProps {
  title: ReactNode;
  image: ReactNode;
  description: ReactNode;
}

const Step = ({ title, image, description }: StepProps) => (
  <HStack
    w="100%"
    justifyContent="space-between"
    gap={5}
    flexDir={{ base: "column", lg: "row" }}
  >
    {image}
    <VStack gap={2} alignItems="flex-start">
      <Heading as="h2" textAlign="center" fontSize="xl">
        {title}
      </Heading>
      <Text maxW="md">{description}</Text>
    </VStack>
  </HStack>
);

const CollectDataIllustration = () => {
  const props = {
    data: graphData,
    bgColor: "white",
    w: "158px",
  };
  return (
    <HStack w="200px" position="relative" mb="5">
      <RecordingGraph {...props} />
      <RecordingGraph {...props} position="absolute" left="20px" top="10px" />
      <RecordingGraph {...props} position="absolute" left="40px" top="20px" />
    </HStack>
  );
};

const TestModelStepIllustration = () => {
  const [value, setValue] = useState(0.75);
  const colorScheme = value >= 0.8 ? "green.500" : undefined;
  useInterval(() => {
    setValue((value) => 0.8 * value + 0.2 * Math.min(1, 2.5 * Math.random()));
  }, 1500);
  return (
    <VStack
      w="200px"
      bgColor="white"
      borderRadius="md"
      justifyContent="space-between"
      alignItems="stretch"
      px={5}
      py={5}
      gap={4}
    >
      <PercentageDisplay
        value={value}
        alignSelf="center"
        colorScheme={colorScheme}
      />
      <PercentageMeter value={value} colorScheme={colorScheme} />
    </VStack>
  );
};

const CodeIllustration = () => {
  return (
    <Image src={blockImage} alt="" aspectRatio={288 / 172} width="200px" />
  );
};

export default HomePage;
