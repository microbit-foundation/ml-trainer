import { Icon, Text, VStack } from "@chakra-ui/react";
import { RiInformationLine } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import ClickableTooltip from "./ClickableTooltip";
import { useDeployment } from "../deployment";

export interface InfoToolTipProps {
  titleId: string;
  descriptionId: string;
}
const InfoToolTip = ({ titleId, descriptionId }: InfoToolTipProps) => {
  const { appNameFull } = useDeployment();
  return (
    <ClickableTooltip
      hasArrow
      placement="right"
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
      <Icon h={5} w={5} as={RiInformationLine} />
    </ClickableTooltip>
  );
};
export default InfoToolTip;
