import { Grid, GridItem, GridProps, HStack, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import InfoToolTip from "./InfoToolTip";

interface GridColumnHeadingItemProps {
  titleId?: string;
  descriptionId?: string;
}

interface HeadingGridProps extends GridProps {
  headings: GridColumnHeadingItemProps[];
}

const HeadingGrid = ({ headings, ...props }: HeadingGridProps) => {
  return (
    <Grid
      flexShrink={0}
      h="3.25rem"
      alignItems="center"
      borderTopWidth={3}
      borderBottomWidth={3}
      borderColor="gray.200"
      {...props}
    >
      {headings.map((props, idx) => (
        <GridColumnHeadingItem {...props} key={idx} />
      ))}
    </Grid>
  );
};

const GridColumnHeadingItem = (props: GridColumnHeadingItemProps) => {
  return (
    <GridItem>
      {props.titleId && props.descriptionId && (
        <HStack opacity={0.7}>
          <Text>
            <FormattedMessage id={props.titleId} />
          </Text>
          <InfoToolTip
            titleId={props.titleId}
            descriptionId={props.descriptionId}
          ></InfoToolTip>
        </HStack>
      )}
    </GridItem>
  );
};

export default HeadingGrid;
