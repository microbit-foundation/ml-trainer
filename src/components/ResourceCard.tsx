import {
  AspectRatio,
  HStack,
  Heading,
  Image,
  LinkBox,
  LinkOverlay,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import Link from "./Link";
import { createResourcePageUrl } from "../urls";
import { ResourceId } from "../pages-config";

interface ResourceCardProps {
  id: ResourceId;
  imgSrc: string;
}

const ResourceCard = ({ id, imgSrc }: ResourceCardProps) => {
  return (
    <LinkBox
      display="flex"
      flexDir="column"
      bgColor="white"
      borderRadius="10px"
      overflow="hidden"
      maxW="22rem"
      boxShadow="0 0 12px 0 rgba(0,0,0,.1)"
    >
      <AspectRatio w="100%" ratio={16 / 9} position="relative">
        <Image src={imgSrc} />
      </AspectRatio>
      <VStack p={3} py={2} pb={3} flexGrow={1} spacing={3} alignItems="stretch">
        <HStack justifyContent="space-between" alignItems="flex-start">
          <Heading as="h3" fontSize="lg" fontWeight="bold" m={3}>
            <LinkOverlay href={createResourcePageUrl(id)} as={Link}>
              <FormattedMessage id={`${id}-title`} />
            </LinkOverlay>
          </Heading>
        </HStack>
      </VStack>
    </LinkBox>
  );
};

export default ResourceCard;
