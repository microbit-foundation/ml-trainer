/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { Grid, GridItem, HStack, Text } from "../shared-ui";
import InfoToolTip from "./InfoToolTip";

interface HeadingGridProps {
  headings: GridColumnHeadingItemProps[];
  /** Extra classes for the grid (e.g. a `css(...)` result from the caller). */
  className?: string;
}
const HeadingGrid = ({ headings, className }: HeadingGridProps) => {
  return (
    <Grid
      flexShrink={0}
      alignItems="center"
      position="sticky"
      top={0}
      height="3.25rem"
      borderBottomWidth="3px"
      borderBottomStyle="solid"
      borderColor="gray.200"
      zIndex={1}
      backgroundColor="whitesmoke"
      className={className}
    >
      {headings.map((props, idx) => (
        <GridColumnHeadingItem {...props} key={idx} />
      ))}
    </Grid>
  );
};

export interface GridColumnHeadingItemProps {
  titleId?: string;
  descriptionId?: string;
  itemsRight?: ReactNode;
}

const GridColumnHeadingItem = (props: GridColumnHeadingItemProps) => {
  return (
    <GridItem>
      {props.titleId && props.descriptionId && (
        <HStack justifyContent="space-between">
          <HStack>
            <Text opacity={0.7}>
              <FormattedMessage id={props.titleId} />
            </Text>
            <InfoToolTip
              titleId={props.titleId}
              descriptionId={props.descriptionId}
            />
          </HStack>
          {props.itemsRight}
        </HStack>
      )}
    </GridItem>
  );
};

export default HeadingGrid;
