import { Box, HStack } from "@chakra-ui/react";
import styles from "./styles.module.css";

// TODO: Maybe use framer-motion for this
const LoadingAnimation = () => {
  return (
    <HStack justifyContent="center" width="100%" h={25} position="relative">
      <Box className={styles.loader} color="green.500"></Box>
    </HStack>
  );
};

export default LoadingAnimation;
