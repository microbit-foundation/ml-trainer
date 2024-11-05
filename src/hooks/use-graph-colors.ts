import { useToken } from "@chakra-ui/react";

export const useGraphColors = () => {
  // colorblind wheel from https://seaborn.pydata.org/tutorial/color_palettes.html
  const x = useToken("colors", "rgb(213, 94, 0)");
  const y = useToken("colors", "rgb(1, 158, 115)");
  const z = useToken("colors", "rgb(87, 180, 233)");
  return { x, y, z };
};
