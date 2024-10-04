import {
  Box,
  GridItem,
  HStack,
  Icon,
  Image,
  SimpleGrid,
  Text,
  UseRadioProps,
  VStack,
} from "@chakra-ui/react";
import { RiCheckFill } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import microbitOnWrist from "../images/stylised-microbit-on-wrist2.svg";
import microbitWithComputer from "../images/stylised-microbit-with-computer.svg";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";

export interface DownloadRadioHelpDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {}

const DownloadRadioHelpDialog = ({
  ...props
}: DownloadRadioHelpDialogProps) => {
  return (
    <ConnectContainerDialog
      {...props}
      headingId="download-project-radio-help-title"
    >
      <VStack gap={5} w="full">
        <Text textAlign="left" w="full">
          <FormattedMessage id="download-project-radio-help-description" />
        </Text>
        <SimpleGrid
          columns={2}
          gap={5}
          w="full"
          justifyContent="space-evenly"
          mb={3}
        >
          {[
            {
              textId: "data-collection-microbit",
              imgSrc: microbitOnWrist,
              isSelected: true,
            },
            {
              textId: "radio-link-microbit",
              imgSrc: microbitWithComputer,
              isSelected: false,
            },
          ].map((config, idx) => {
            return <Item key={idx} {...config} />;
          })}
        </SimpleGrid>
      </VStack>
    </ConnectContainerDialog>
  );
};

interface RadioCardProps extends UseRadioProps {
  textId: string;
  imgSrc: string;
  isSelected: boolean;
}

const Item = ({ textId, imgSrc, isSelected }: RadioCardProps) => {
  return (
    <GridItem>
      <Box
        w="100%"
        h="100%"
        borderWidth={isSelected ? "5px" : "0px"}
        borderRadius="3xl"
        borderColor={isSelected ? "brand.600" : "gray.500"}
        p={4}
      >
        <HStack justifyContent="right" mb={-7} mt={-1} mr={-1}>
          <Icon
            as={RiCheckFill}
            boxSize={10}
            color={isSelected ? "brand.600" : "transparent"}
          />
        </HStack>
        <VStack p={0} gap={1}>
          <VStack>
            <Image
              boxSize="200px"
              src={imgSrc}
              alt=""
              display="block"
              position="relative"
            />
          </VStack>
          <VStack>
            <Text fontWeight="bold" fontSize="md" w="full">
              <FormattedMessage id={textId} />
            </Text>
          </VStack>
        </VStack>
      </Box>
    </GridItem>
  );
};

export default DownloadRadioHelpDialog;
