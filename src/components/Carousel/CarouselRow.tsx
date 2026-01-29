import { Box, Heading, HStack } from "@chakra-ui/react";
import NewPageCarousel from "./NewPageCarousel/NewPageCarousel";
import { ReactNode } from "react";

interface CarouselRowProps {
  carouselItems: JSX.Element[];
  itemTypeMessage: string;
  title: string | ReactNode;
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
        {typeof title === "string" ? (
          <Heading as="h2" fontSize="3xl">
            {title}
          </Heading>
        ) : (
          title
        )}
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
