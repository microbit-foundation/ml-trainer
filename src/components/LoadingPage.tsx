import { Flex, VisuallyHidden } from "@chakra-ui/react";
import LoadingAnimation from "./LoadingAnimation";
import { FormattedMessage } from "react-intl";

const LoadingPage = () => {
  return (
    <Flex flexGrow={1} justifyContent="center" alignItems="center">
      <VisuallyHidden>
        <FormattedMessage id="loading" />
      </VisuallyHidden>
      <LoadingAnimation />
    </Flex>
  );
};

export default LoadingPage;
