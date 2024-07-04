import { avatarAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers, defineStyle } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(avatarAnatomy.keys);

const md2 = defineStyle({
  width: 10,
  height: 10,
  fontSize: "md",
});

const sizes = {
  "2md": definePartsStyle({ container: md2 }),
};

const avatarTheme = defineMultiStyleConfig({ sizes });

export default avatarTheme;
