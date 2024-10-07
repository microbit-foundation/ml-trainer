import {
  AspectRatio,
  HStack,
  Heading,
  Image,
  LinkBox,
  LinkOverlay,
  VStack,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import Link from "./Link";

interface ResourceCardProps {
  url: string;
  imgSrc: string;
  title: ReactNode;
}

const ResourceCard = ({ imgSrc, url, title }: ResourceCardProps) => {
  return (
    <LinkBox
      display="flex"
      flexDir="column"
      bgColor="white"
      borderRadius="10px"
      overflow="hidden"
      w={64}
      boxShadow="md"
    >
      <AspectRatio w="100%" ratio={4 / 3} position="relative">
        <Image src={imgSrc} />
      </AspectRatio>
      <VStack p={3} py={2} pb={3} flexGrow={1} spacing={3} alignItems="stretch">
        <HStack justifyContent="space-between" alignItems="flex-start">
          <Heading as="h3" fontSize="lg" fontWeight="bold" m={3}>
            <LinkOverlay href={url} as={Link}>
              {title}
            </LinkOverlay>
          </Heading>
        </HStack>
      </VStack>
    </LinkBox>
  );
};

export default ResourceCard;
