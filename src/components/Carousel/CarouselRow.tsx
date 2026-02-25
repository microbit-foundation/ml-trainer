import { Box, Heading, HStack } from "@chakra-ui/react";
import NewPageCarousel from "./NewPageCarousel/NewPageCarousel";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import styles from "./CarouselRow.module.css";

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
      <HStack
        className={styles.title}
        mt={2}
        mb={2}
        spacing={{ base: 3, sm: 12 }}
        justifyContent={{ base: "space-between", sm: "flex-start" }}
      >
        {typeof titleId === "string" ? (
          <Heading as="h2" size="lg">
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
