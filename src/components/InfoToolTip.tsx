/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { RiInformationLine } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { useDeployment } from "../deployment";
import { Icon, Text, TooltipProps, VStack } from "../shared-ui";
import ClickableTooltip from "./ClickableTooltip";

export interface InfoToolTipProps {
  titleId: string;
  descriptionId: string;
  placement?: TooltipProps["placement"];
  isDisabled?: boolean;
}
const InfoToolTip = ({
  titleId,
  descriptionId,
  placement = "right",
  isDisabled,
}: InfoToolTipProps) => {
  const { appNameFull } = useDeployment();
  return (
    <ClickableTooltip
      titleId={titleId}
      hasArrow
      placement={placement}
      isDisabled={isDisabled}
      label={
        <VStack textAlign="left" alignItems="flex-start" m={3}>
          <Text fontWeight="bold">
            <FormattedMessage id={titleId} />
          </Text>
          <Text>
            <FormattedMessage id={descriptionId} values={{ appNameFull }} />
          </Text>
        </VStack>
      }
    >
      <Icon
        as={RiInformationLine}
        css={{ opacity: 0.7, width: 5, height: 5 }}
      />
    </ClickableTooltip>
  );
};
export default InfoToolTip;
