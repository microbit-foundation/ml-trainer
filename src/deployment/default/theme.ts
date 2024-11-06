import { extendTheme, withDefaultVariant } from "@chakra-ui/react";

import colors from "./colors";
import Alert from "./components/alert";
import Button from "./components/button";
import fonts from "./fonts";
import radii from "./radii";
import shadows from "./shadows";

// See https://chakra-ui.com/docs/theming/customize-theme
const overrides = {
  fonts,
  radii,
  colors,
  shadows,
  components: {
    Alert,
    Button,
  },
};

export default extendTheme(
  overrides,
  withDefaultVariant({
    variant: "secondary",
    components: ["Button", "IconButton"],
  })
);
