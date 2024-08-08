import { Grid, GridItem, GridProps, HStack, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import InfoToolTip from "./InfoToolTip";
import { ReactNode } from "react";

interface GridColumnHeadingItemProps {
  titleId?: string;
  descriptionId?: string;
}

interface HeadingGridProps extends Omit<GridProps, "children"> {
  headings: GridColumnHeadingItemProps[];
  children?: ReactNode;
}

const HeadingGrid = ({ headings, children, ...props }: HeadingGridProps) => {
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
      {headings.map((props, idx) => {
        return idx < headings.length - 1 ? (
          <GridColumnHeadingItem {...props} key={idx} />
        ) : (
          <HStack justifyContent="space-between" key={idx}>
            <GridColumnHeadingItem {...props} />
            {children}
          </HStack>
        );
      })}
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
