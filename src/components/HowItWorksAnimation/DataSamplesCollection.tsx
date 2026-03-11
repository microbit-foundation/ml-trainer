/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Grid,
  GridItem,
  GridProps,
  HStack,
  Icon,
  IconProps,
} from "@chakra-ui/react";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { useAnimation } from "../AnimationProvider";
import HeartLedIcon from "./HeartLedIcon";
import CrossLedIcon from "./CrossLedIcon";
import { animations } from "./utils";

export interface DataSamplesCollectionRef {
  playTopSamples(): Promise<void>;
  playBottomSamples(): Promise<void>;
  reset(): void;
}

const iconSize = { base: "1.25em", sm: "1.25em", md: "1.25em" };
const sampleTransitionDelay = 0.5; // s
const sampleTransitionDuration = 0.4; // s
const numSamplesPerRow = 3;

const topSamples = [{ order: 1 }, { order: 2 }, { order: 3 }];
const bottomSamples = [{ order: 1 }, { order: 2 }, { order: 3 }];

export const dataCollectionDurationInSec =
  sampleTransitionDelay * numSamplesPerRow +
  sampleTransitionDuration * numSamplesPerRow;

const DataSamplesCollection = forwardRef<DataSamplesCollectionRef, GridProps>(
  function DataSamplesCollection({ ...props }, ref) {
    const { delayInSec, withPlayState } = useAnimation();
    const [topVisible, setTopVisible] = useState(false);
    const [bottomVisible, setBottomVisible] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        async playTopSamples() {
          setTopVisible(true);
          await delayInSec(dataCollectionDurationInSec);
        },
        async playBottomSamples() {
          setBottomVisible(true);
          await delayInSec(dataCollectionDurationInSec);
        },
        reset() {
          setTopVisible(false);
          setBottomVisible(false);
        },
      }),
      [delayInSec]
    );

    // Helper to build the animation CSS value for a given sample order and visibility.
    const getSampleAnimation = useCallback(
      (order: number, visible: boolean): string | undefined => {
        if (!visible) {
          return undefined;
        }
        const delay = order * sampleTransitionDelay;
        const animation = `${animations.fadeIn} ${sampleTransitionDuration}s ease-in-out ${delay}s both`;
        return animation ? withPlayState(animation) : undefined;
      },
      [withPlayState]
    );

    if (!topVisible && !bottomVisible) {
      return null;
    }

    return (
      <Grid
        templateColumns={{
          base: `${iconSize.base} 1fr`,
          sm: `${iconSize.sm} 1fr`,
          md: `${iconSize.md} 1fr`,
        }}
        columnGap={2}
        rowGap={{ sm: 1, md: 2 }}
        alignItems="center"
        display={topVisible || bottomVisible ? "grid" : "none"}
        {...props}
      >
        <GridItem w="auto">
          <HeartLedIcon boxSize={iconSize} color="gray.600" />
        </GridItem>
        <GridItem>
          <HStack gap={1}>
            {topVisible &&
              topSamples.map(({ order }, i) => (
                <DataSample1
                  key={i}
                  animation={getSampleAnimation(order, topVisible)}
                />
              ))}
          </HStack>
        </GridItem>
        <GridItem>
          <CrossLedIcon boxSize={iconSize} color="gray.600" />
        </GridItem>
        <GridItem>
          <HStack gap={1}>
            {bottomVisible &&
              bottomSamples.map(({ order }, i) => (
                <DataSample2
                  key={i}
                  opacity={0}
                  animation={getSampleAnimation(order, bottomVisible)}
                />
              ))}
          </HStack>
        </GridItem>
      </Grid>
    );
  }
);

const DataSample1 = (props: IconProps) => (
  <Icon
    viewBox="0 0 28 22"
    fill="none"
    boxSize={iconSize}
    color="gray.600"
    {...props}
  >
    <path
      d="M22.1 21.3H5C2.2 21.3 0 19.1 0 16.3V5C0 2.2 2.2 0 5 0H22.1C24.9 0 27.1 2.2 27.1 5V16.4C27.1 19.2 24.9 21.4 22.1 21.4V21.3ZM5 2.2C3.5 2.2 2.2 3.4 2.2 5V16.4C2.2 17.9 3.4 19.2 5 19.2H22.1C23.6 19.2 24.9 18 24.9 16.4V5C24.9 3.5 23.7 2.2 22.1 2.2H5Z"
      fill="currentColor"
    />
    <path
      d="M16.3001 15.9998C16.1001 15.9998 15.8001 15.9998 15.6001 15.7998C14.7001 15.1998 14.4001 14.2998 14.2001 13.6998C14.0001 12.8998 13.8001 12.0998 13.7001 11.2998C13.6001 10.4998 13.5001 9.7998 13.3001 9.0998C13.1001 8.2998 12.8001 8.0998 12.7001 8.0998C12.7001 8.0998 12.2001 8.3998 12.0001 9.2998V9.3998C12.0001 9.5998 11.8001 10.1998 11.7001 10.7998C11.5001 11.6998 11.4001 12.7998 11.1001 13.7998C11.1001 13.7998 11.1001 13.7998 11.1001 13.8998C11.0001 14.0998 10.5001 14.7998 9.8001 14.7998C9.3001 14.7998 8.9001 14.2998 8.7001 13.5998C8.5001 12.9998 8.5001 12.3998 8.4001 11.8998C8.4001 11.4998 8.4001 10.9998 8.2001 10.7998C7.9001 10.6998 7.5001 10.5998 7.4001 10.6998C7.1001 11.0998 6.3001 12.0998 5.4001 11.9998C5.0001 11.9998 4.7001 11.6998 4.6001 11.3998C4.6001 11.2998 4.5001 11.1998 4.4001 10.9998C4.4001 10.8998 4.3001 10.6998 4.2001 10.5998C3.9001 10.5998 3.6001 10.1998 3.6001 9.8998C3.6001 9.5998 3.9001 9.1998 4.3001 9.1998C5.1001 9.1998 5.4001 9.8998 5.6001 10.3998C5.8001 10.2998 6.0001 10.0998 6.1001 9.7998C6.8001 8.8998 8.3001 9.3998 8.6001 9.4998C9.4001 9.7998 9.5001 10.6998 9.6001 11.7998C9.6001 11.9998 9.6001 12.2998 9.6001 12.5998C9.8001 11.8998 9.9001 11.1998 10.0001 10.6998C10.2001 9.7998 10.2001 9.2998 10.4001 8.9998C10.8001 7.5998 11.5001 6.7998 12.5001 6.7998C12.9001 6.7998 14.0001 6.9998 14.5001 8.8998C14.7001 9.6998 14.9001 10.4998 15.0001 11.2998C15.1001 12.0998 15.2001 12.7998 15.5001 13.5998C15.6001 13.9998 15.8001 14.5998 16.2001 14.7998C16.4001 14.6998 16.7001 14.1998 16.9001 13.3998V13.2998C16.9001 13.0998 17.1001 12.5998 17.2001 12.0998C17.3001 11.4998 17.5001 10.8998 17.7001 10.1998C17.9001 9.5998 18.1001 9.0998 18.3001 8.6998C18.3001 8.5998 18.5001 8.3998 18.7001 8.3998C18.9001 8.3998 19.9001 7.8998 20.7001 8.3998C21.0001 8.5998 21.3001 8.8998 21.4001 9.5998C21.4001 10.0998 21.9001 10.2998 22.1001 10.2998C22.3001 10.0998 22.7001 10.0998 22.9001 10.2998C23.2001 10.4998 23.3001 10.9998 23.1001 11.2998C22.8001 11.6998 22.3001 11.8998 21.7001 11.7998C20.9001 11.5998 20.1001 10.8998 19.9001 9.7998C19.9001 9.7998 19.6001 9.7998 19.4001 9.7998C19.3001 10.0998 19.2001 10.3998 19.0001 10.7998C18.8001 11.3998 18.7001 11.9998 18.6001 12.5998C18.5001 13.1998 18.3001 13.6998 18.2001 14.0998C18.0001 14.6998 17.7001 15.9998 16.7001 16.3998C16.5001 16.3998 16.3001 16.4998 16.0001 16.5998L16.3001 15.9998Z"
      fill="currentColor"
    />
  </Icon>
);

const DataSample2 = (props: IconProps) => (
  <Icon
    viewBox="0 0 27 22"
    fill="none"
    boxSize={iconSize}
    color="gray.600"
    {...props}
  >
    <path
      d="M22.1 21.3H5C2.2 21.3 0 19.1 0 16.3V5C0 2.2 2.2 0 4.9 0H22C24.8 0 27 2.2 27 5V16.4C27 19.2 24.8 21.4 22 21.4L22.1 21.3ZM4.9 2.2C3.4 2.2 2.1 3.4 2.1 5V16.4C2.1 17.9 3.3 19.2 4.9 19.2H22C23.5 19.2 24.8 18 24.8 16.4V5C24.8 3.5 23.6 2.2 22 2.2H4.9Z"
      fill="currentColor"
    />
    <path
      d="M11.7999 17.5004C11.0999 17.5004 10.8999 17.5004 9.2999 9.10039C9.2999 8.80039 9.1999 8.40039 9.0999 8.10039C8.6999 9.50039 8.2999 11.2004 7.8999 12.9004C7.8999 13.2004 7.4999 13.5004 7.1999 13.5004H5.0999C4.6999 13.5004 4.3999 13.2004 4.3999 12.8004C4.3999 12.4004 4.6999 12.1004 5.0999 12.1004H6.5999C8.2999 4.90039 8.5999 4.90039 9.1999 4.90039C9.4999 4.90039 9.8999 5.10039 9.9999 5.40039C10.0999 5.70039 10.2999 6.60039 10.6999 9.00039C10.9999 10.5004 11.3999 12.8004 11.7999 14.4004C12.4999 11.8004 12.6999 11.2004 13.3999 11.2004C13.5999 11.2004 13.8999 11.2004 14.1999 11.6004C14.4999 11.9004 14.9999 12.4004 15.4999 12.9004C15.7999 11.9004 16.0999 11.2004 16.6999 11.0004C17.9999 10.4004 18.7999 12.0004 19.1999 12.7004C19.7999 12.7004 21.1999 12.2004 22.2999 11.8004C22.6999 11.7004 23.0999 11.8004 23.1999 12.2004C23.2999 12.6004 23.1999 13.0004 22.7999 13.1004C18.6999 14.7004 18.2999 14.0004 18.0999 13.7004C18.0999 13.7004 17.9999 13.5004 17.8999 13.4004C17.7999 13.2004 17.4999 12.6004 17.2999 12.4004C17.0999 12.7004 16.8999 13.4004 16.7999 13.8004C16.5999 14.6004 16.3999 15.2004 15.7999 15.2004C15.6999 15.2004 15.1999 15.2004 14.9999 14.7004C14.9999 14.5004 14.2999 13.9004 13.7999 13.3004C13.5999 13.9004 13.2999 14.9004 13.1999 15.5004C12.9999 16.5004 12.7999 17.0004 12.6999 17.4004C12.5999 17.7004 12.2999 17.9004 11.8999 17.9004L11.7999 17.5004Z"
      fill="currentColor"
    />
  </Icon>
);

export default DataSamplesCollection;
