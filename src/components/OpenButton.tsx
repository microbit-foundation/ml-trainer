import { Button } from "@chakra-ui/react";
import { useRef } from "react";
import { RiFolderOpenLine } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import LoadProjectInput, { LoadProjectInputRef } from "./LoadProjectInput";

const OpenButton = () => {
  const ref = useRef<LoadProjectInputRef>(null);
  return (
    <>
      <Button
        variant="toolbar"
        leftIcon={<RiFolderOpenLine />}
        onClick={() => ref.current?.chooseFile()}
      >
        <FormattedMessage id="open-file-action" />
      </Button>
      <LoadProjectInput ref={ref} accept=".hex" />
    </>
  );
};

export default OpenButton;
