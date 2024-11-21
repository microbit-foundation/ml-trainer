import { Icon, Image, Link, Text, VStack } from "@chakra-ui/react";
import { RiExternalLinkLine } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { useDeployment } from "../deployment";
import microbitConnectedImage from "../images/stylised-microbit-connected.svg";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";

export interface ConnectBatteryDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {}

const ConnectBatteryDialog = ({ ...props }: ConnectBatteryDialogProps) => {
  const { supportLinks } = useDeployment();
  return (
    <ConnectContainerDialog headingId="connect-battery-heading" {...props}>
      <VStack gap={5} width="100%">
        <Text alignSelf="left" width="100%">
          <FormattedMessage id="connect-battery-subtitle" />
          <Link
            color="brand.600"
            textDecoration="underline"
            href={supportLinks.wearable}
            target="_blank"
            rel="noopener"
            display="flex"
            flexDirection="row"
            gap={1}
          >
            <FormattedMessage id="connect-battery-link" />
            <Icon
              as={RiExternalLinkLine}
              boxSize={5}
              color="brand.600"
              position="relative"
            />
          </Link>
        </Text>
        <Image
          height="229px"
          width="16rem"
          src={microbitConnectedImage}
          alt=""
        />
      </VStack>
    </ConnectContainerDialog>
  );
};

export default ConnectBatteryDialog;
