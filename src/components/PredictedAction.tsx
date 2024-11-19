import {
  HStack,
  Text,
  usePrevious,
  VisuallyHidden,
  VStack,
} from "@chakra-ui/react";
import debounce from "lodash.debounce";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useStore } from "../store";
import { tourElClassname } from "../tours";
import InfoToolTip from "./InfoToolTip";
import LedIcon from "./LedIcon";
import { predictedActionDisplayWidth } from "./LiveGraphPanel";

const PredictedAction = () => {
  const intl = useIntl();
  const predictionResult = useStore((s) => s.predictionResult);
  const [estimatedAction, setEstimatedAction] = useState<string>(
    intl.formatMessage({ id: "unknown" })
  );
  const debouncedEstimatedAction = useMemo(
    () =>
      debounce((name: string | undefined) => {
        if (name) {
          setEstimatedAction(name);
        } else {
          setEstimatedAction(intl.formatMessage({ id: "unknown" }));
        }
      }, 500),
    [intl]
  );

  const prevEstimatedAction = usePrevious(predictionResult?.detected?.name);
  useEffect(() => {
    if (prevEstimatedAction !== predictionResult?.detected?.name) {
      debouncedEstimatedAction(predictionResult?.detected?.name);
    }
  }, [debouncedEstimatedAction, predictionResult, prevEstimatedAction]);

  return (
    <VStack
      className={tourElClassname.estimatedAction}
      w={`${predictedActionDisplayWidth}px`}
      gap={0}
      h="100%"
      py={2.5}
      pt={3.5}
    >
      <VisuallyHidden aria-live="polite">
        <FormattedMessage
          id="estimated-action-aria"
          values={{
            action: estimatedAction,
          }}
        />
      </VisuallyHidden>
      <HStack justifyContent="flex-start" w="100%" gap={2} pr={2} mb={3}>
        <Text size="md" fontWeight="bold" alignSelf="start">
          <FormattedMessage id="estimated-action-label" />
        </Text>
        <InfoToolTip
          titleId="estimated-action-label"
          descriptionId="estimated-action-tooltip"
        />
      </HStack>
      <VStack justifyContent="center" flexGrow={1} mb={0.5}>
        <LedIcon
          icon={predictionResult?.detected?.icon ?? "off"}
          size="70px"
          isTriggered
        />
      </VStack>
      <Text
        size="md"
        fontWeight="bold"
        color={predictionResult?.detected ? "brand2.600" : "gray.600"}
        isTruncated
        textAlign="center"
        w={`${predictedActionDisplayWidth}px`}
      >
        {predictionResult?.detected?.name ?? <FormattedMessage id="unknown" />}
      </Text>
    </VStack>
  );
};

export default PredictedAction;
