import { Box, BoxProps, useToken } from "@chakra-ui/react";

export interface TourModelArrowProps extends BoxProps {
  outer: any;
  inner: any;
}

const TourModalArrow = ({ outer, inner }: TourModelArrowProps) => {
  return (
    <Box {...outer} className="chakra-popover__arrow-positioner">
      <Box
        className="chakra-popover__arrow"
        {...inner}
        __css={{
          "--popper-arrow-shadow-color": "grey",
          "--popper-arrow-bg": "white",
          "--popper-arrow-shadow": useToken("shadows", "none"),
        }}
      />
    </Box>
  );
};

export default TourModalArrow;
