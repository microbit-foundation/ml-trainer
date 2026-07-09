/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import debounce from "lodash.debounce";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { css, HStack, Text, VisuallyHidden, VStack } from "../shared-ui";
import { useStore } from "../store";
import { tourElClassname } from "../tours";
import InfoToolTip from "./InfoToolTip";
import LedIcon from "./LedIcon";
import { predictedActionDisplayWidth } from "./LiveGraphPanel";
import { useShallow } from "zustand/react/shallow";

const PredictedAction = () => {
  const intl = useIntl();
  const predictionDetected = useStore(
    useShallow((s) => s.predictionResult?.detected)
  );
  const estimatedAction = predictionDetected?.name;
  const estimatedIcon = predictionDetected?.icon ?? "off";
  const [liveRegionEstimatedAction, setLiveRegionEstimatedAction] = useState<
    string | undefined
  >(estimatedAction);
  const setLiveRegionEstimatedActionDebounced = useMemo(
    () => debounce(setLiveRegionEstimatedAction, 500),
    []
  );
  useEffect(() => {
    setLiveRegionEstimatedActionDebounced(estimatedAction);
  }, [setLiveRegionEstimatedActionDebounced, estimatedAction]);

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
            action:
              liveRegionEstimatedAction ??
              intl.formatMessage({ id: "unknown" }),
          }}
        />
      </VisuallyHidden>
      <HStack justifyContent="flex-start" w="100%" gap={2} pr={2} mb={3}>
        <Text fontWeight="bold" alignSelf="start">
          <FormattedMessage id="estimated-action-label" />
        </Text>
        <InfoToolTip
          titleId="estimated-action-label"
          descriptionId="estimated-action-tooltip"
        />
      </HStack>
      <VStack justifyContent="center" flexGrow={1} mb={0.5}>
        <LedIcon icon={estimatedIcon} size="70px" colorScheme="brand2" />
      </VStack>
      {/* Display workaround for in-context translation error caused by DOM change. */}
      <EstimatedActionText
        detected={!!predictionDetected}
        visible={!!estimatedAction}
      >
        {estimatedAction}
      </EstimatedActionText>
      <EstimatedActionText
        detected={!!predictionDetected}
        visible={!estimatedAction}
      >
        <FormattedMessage id="unknown" />
      </EstimatedActionText>
    </VStack>
  );
};

const EstimatedActionText = ({
  detected,
  visible,
  children,
}: {
  detected: boolean;
  visible: boolean;
  children: React.ReactNode;
}) => (
  <Text
    fontWeight="bold"
    truncate
    textAlign="center"
    w="180px"
    className={css({ display: visible ? "block" : "none" })}
    color={detected ? "brand2.600" : "gray.600"}
  >
    {children}
  </Text>
);

export default PredictedAction;
