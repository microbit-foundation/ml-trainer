import { Box, Heading, HStack } from "@chakra-ui/react";
import NewPageCarousel from "./NewPageCarousel/NewPageCarousel";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";

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
    <Box w="100%" py={8}>
      <HStack px={16} mt={2} mb={2} spacing={4}>
        {typeof titleId === "string" ? (
          <Heading as="h2" fontSize="3xl">
            <FormattedMessage id={titleId} />
          </Heading>
        ) : (
          titleElement
        )}
        <HStack spacing={3}>{actions}</HStack>
      </HStack>
      <NewPageCarousel
        carouselItems={carouselItems}
        containerMessageId={containerMessageId}
      />
    </Box>
  );
};

export default CarouselRow;
