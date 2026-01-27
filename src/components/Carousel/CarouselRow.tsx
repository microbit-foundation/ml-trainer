import { Box, Heading, HStack } from "@chakra-ui/react";
import NewPageCarousel from "./NewPageCarousel/NewPageCarousel";

interface CarouselRowProps {
  carouselItems: JSX.Element[];
  itemTypeMessage: string;
  title: string;
  actions?: JSX.Element[];
}

const CarouselRow = ({
  carouselItems,
  itemTypeMessage,
  title,
  actions,
}: CarouselRowProps) => {
  return (
    <Box w="100%" py={8}>
      <HStack px={16} mt={2} mb={2} justifyContent="space-between">
        <Heading as="h2" fontSize="3xl">
          {title}
        </Heading>
        <HStack>{actions}</HStack>
      </HStack>
      <NewPageCarousel
        carouselItems={carouselItems}
        itemTypeMessage={itemTypeMessage}
      />
    </Box>
  );
};

export default CarouselRow;
