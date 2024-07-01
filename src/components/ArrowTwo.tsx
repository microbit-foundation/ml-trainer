import { Box, Text } from "@chakra-ui/react";

const ArrowTwo = () => {
  return (
    <svg
      width="244"
      height="180"
      viewBox="0 0 244 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="13" y="25" width="202" height="10" fill="#00a000" />
      <rect x="13" y="25" width="10" height="120" fill="#00a000" />
      <circle cx="202" cy="30" r="20" fill="#00a000" />
      <path d="M17.5 170L2.34455 133.75H32.6554L17.5 170Z" fill="#00a000" />
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
