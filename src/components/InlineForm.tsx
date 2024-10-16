import { BoxProps, Stack } from "@chakra-ui/react";
import { ReactNode } from "react";

interface InlineFormProps extends BoxProps {
  children?: ReactNode;
}

/**
 * Intended to be used inside InlineFormBackdrop.
 */
const InlineForm = (props: InlineFormProps) => {
  return (
    <Stack
      bgColor="white"
      spacing={5}
      m={[0, 5, 20]}
      borderRadius={[0, "20px"]}
      borderWidth={[null, 1]}
      borderBottomWidth={1}
      borderColor={[null, "gray.300"]}
      py={[5, 8]}
      px={[3, 5, 8]}
      minW={[null, null, "xl"]}
      alignItems="stretch"
      {...props}
    />
  );
};

export default InlineForm;
