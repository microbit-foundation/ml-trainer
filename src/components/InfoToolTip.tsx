/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { RiInformationLine } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useDeployment } from "../deployment";
import { Icon, Text, TooltipButton, TooltipProps, VStack } from "@microbit/ui";

export interface InfoToolTipProps {
  titleId: string;
  descriptionId: string;
  placement?: TooltipProps["placement"];
}
const InfoToolTip = ({
  titleId,
  descriptionId,
  placement = "right",
}: InfoToolTipProps) => {
  const { appNameFull } = useDeployment();
  const intl = useIntl();
  return (
    <TooltipButton
      aria-label={intl.formatMessage({ id: `${titleId}-tooltip-aria` })}
      hasArrow
      placement={placement}
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
    </TooltipButton>
  );
};
export default InfoToolTip;
