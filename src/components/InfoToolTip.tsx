import { Icon, Text, TooltipProps, VStack } from "@chakra-ui/react";
import { RiInformationLine } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { useDeployment } from "../deployment";
import ClickableTooltip from "./ClickableTooltip";

export interface InfoToolTipProps extends Omit<TooltipProps, "children"> {
  titleId: string;
  descriptionId: string;
}
const InfoToolTip = ({ titleId, descriptionId, ...rest }: InfoToolTipProps) => {
  const { appNameFull } = useDeployment();
  return (
    <ClickableTooltip
      isFocusable
      titleId={titleId}
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
      <Icon opacity={0.7} h={5} w={5} as={RiInformationLine} />
    </ClickableTooltip>
  );
};
export default InfoToolTip;
