/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Grid, GridItem, GridProps, HStack, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import InfoToolTip from "./InfoToolTip";
import { ReactNode } from "react";

interface HeadingGridProps extends GridProps {
  headings: GridColumnHeadingItemProps[];
}

const HeadingGrid = ({ headings, ...props }: HeadingGridProps) => {
  return (
    <Grid
      flexShrink={0}
      h="3.25rem"
      alignItems="center"
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
