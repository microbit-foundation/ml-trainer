import { Box, Text, useToken } from "@chakra-ui/react";

const ArrowTwo = () => {
  const [brand500] = useToken("colors", ["brand2.500"]);
  return (
    <svg
      width="244"
      height="180"
      viewBox="0 0 244 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="25" y="25" width="180" height="10" fill={brand500} />
      <rect x="25" y="25" width="10" height="120" fill={brand500} />
      <circle cx="202" cy="30" r="20" fill={brand500} />
      <path d="M30 170 L14.84455 133.75 H45.1554 L30 170Z" fill={brand500} />
      <foreignObject x="182" y="10" width="40" height="40">
        <Box
          aria-hidden
          height="40px"
          width="40px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="2xl" color="white">
            2
          </Text>
        </Box>
      </foreignObject>
    </svg>
  );
};
export default ArrowTwo;
