/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode } from "react";
import {
  AspectRatio,
  Box,
  Heading,
  HStack,
  Image,
  LinkBox,
  LinkOverlay,
  VStack,
} from "../shared-ui";

interface ResourceCardProps {
  aspectRatio?: number;
  imagePadding?: number;
  url: string;
  imgSrc: string;
  title: ReactNode;
}

const ResourceCard = ({
  aspectRatio = 4 / 3,
  imagePadding,
  imgSrc,
  url,
  title,
}: ResourceCardProps) => {
  return (
    <LinkBox
      display="flex"
      flexDir="column"
      bg="white"
      borderRadius="10px"
      overflow="hidden"
      w={64}
      boxShadow="md"
      alignSelf="stretch"
    >
      <AspectRatio w="100%" ratio={aspectRatio} position="relative">
        <Box>
          <Image
            src={imgSrc}
            alt=""
            h="100%"
            w="100%"
            // Spacing token scale (0.25rem units); dynamic, so inline style.
            style={
              imagePadding
                ? { padding: `${imagePadding * 0.25}rem` }
                : undefined
            }
          />
        </Box>
      </AspectRatio>
      <VStack p={3} py={2} pb={3} flexGrow={1} gap={3} alignItems="stretch">
        <HStack justifyContent="space-between" alignItems="flex-start">
          <Heading as="h3" fontSize="lg" fontWeight="bold" m={3}>
            <LinkOverlay href={url} _focusVisible={{ focusShadow: "outline" }}>
              {title}
            </LinkOverlay>
          </Heading>
        </HStack>
      </VStack>
    </LinkBox>
  );
};

export default ResourceCard;
