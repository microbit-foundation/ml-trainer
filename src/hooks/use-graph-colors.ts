import { useToken } from "@chakra-ui/react";

export const useGraphColors = () => {
  const x = useToken("colors", "red.300");
  const y = useToken("colors", "brand2.300");
  const z = useToken("colors", "brand.600");
  return { x, y, z };
};
