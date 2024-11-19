import { IconButton, Text, TooltipProps, VStack } from "@chakra-ui/react";
import { RiInformationLine } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useDeployment } from "../deployment";
import ClickableTooltip from "./ClickableTooltip";

export interface InfoToolTipProps extends Omit<TooltipProps, "children"> {
  titleId: string;
  descriptionId: string;
}
const InfoToolTip = ({
  titleId,
  descriptionId,
  isDisabled,
  ...rest
}: InfoToolTipProps) => {
  const { appNameFull } = useDeployment();
  const intl = useIntl();
  return (
    <ClickableTooltip
      hasArrow
      placement="right"
      {...rest}
      label={
        <VStack textAlign="left" alignContent="left" alignItems="left" m={3}>
          <Text fontWeight="bold">
            <FormattedMessage id={titleId} />
          </Text>
          <Text>
            <FormattedMessage id={descriptionId} values={{ appNameFull }} />
          </Text>
        </VStack>
      }
    >
      <IconButton
        size="xs"
        icon={<RiInformationLine opacity={0.7} />}
        fontSize="xl"
        variant="ghost"
        _hover={{
          bgColor: "transparent",
        }}
        _active={{
          bgColor: "transparent",
        }}
        padding={0}
        minW="unset"
        color="chakra-body-text._dark"
        aria-label={intl.formatMessage({ id: `${titleId}-tooltip-aria` })}
        isDisabled={isDisabled}
        _disabled={{
          opacity: 1,
        }}
      />
    </ClickableTooltip>
  );
};
export default InfoToolTip;
