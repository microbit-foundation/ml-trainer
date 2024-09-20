import {
  Button,
  CloseButton,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { TooltipRenderProps } from "react-joyride";

const GuidedTooltip = (props: TooltipRenderProps) => {
  const {
    backProps,
    closeProps,
    continuous: hasNextButton,
    index,
    primaryProps,
    step,
    tooltipProps,
    size: totalNumSteps,
    isLastStep,
  } = props;

  const hasBackButton = index > 0;

  return (
    <VStack
      backgroundColor="white"
      borderRadius="md"
      p={5}
      gap={2}
      {...tooltipProps}
    >
      <VStack width="100%" alignItems="left" gap={1}>
        <HStack justifyContent="space-between">
          {step.title && (
            <Heading as="h2" fontSize="lg" fontWeight="bold">
              <FormattedMessage id={step.title as string} />
            </Heading>
          )}
          <CloseButton
            mt={-5}
            mr={-3}
            size="sm"
            borderRadius="sm"
            {...closeProps}
          />
        </HStack>
        <Text>
          <FormattedMessage id={step.content as string} />
        </Text>
      </VStack>
      <HStack justifyContent="space-between" p={0} w="full">
        <Text>
          Step {index + 1} of {totalNumSteps}
        </Text>
        <HStack gap={2}>
          {hasBackButton && (
            <Button {...backProps} variant="secondary" size="sm">
              <FormattedMessage id="back-action" />
            </Button>
          )}
          {hasNextButton && (
            <Button {...primaryProps} variant="primary" size="sm">
              {isLastStep ? (
                <FormattedMessage id="close-action" />
              ) : (
                <FormattedMessage id="connectMB.nextButton" />
              )}
            </Button>
          )}
        </HStack>
      </HStack>
    </VStack>
  );
};

export default GuidedTooltip;
