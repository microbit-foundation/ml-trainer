/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { Box, Heading, HStack } from "@microbit/ui";
import NewPageCarousel from "./NewPageCarousel";

interface CarouselRowProps {
  carouselItems: JSX.Element[];
  containerMessageId: string;
  titleElement?: ReactNode;
  titleId?: string;
  actions?: JSX.Element[];
}

const CarouselRow = ({
  carouselItems,
  containerMessageId,
  titleElement,
  titleId,
  actions,
}: CarouselRowProps) => {
  return (
    <Box w="100%" py={8} _shortHeight={{ py: 4 }}>
      <HStack
        px={{ base: "12px", md: "20px" }}
        mt={2}
        mb={2}
        gap={{ base: 3, sm: 12 }}
        justifyContent={{ base: "space-between", sm: "flex-start" }}
      >
        {typeof titleId === "string" ? (
          <Heading size="lg">
            <FormattedMessage id={titleId} />
          </Heading>
        ) : (
          titleElement
        )}
        <HStack gap={3}>{actions}</HStack>
      </HStack>
      <NewPageCarousel
        carouselItems={carouselItems}
        containerMessageId={containerMessageId}
      />
    </Box>
  );
};

export default CarouselRow;
