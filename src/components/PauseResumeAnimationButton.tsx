import { Button, Icon } from "@chakra-ui/react";
import { useAnimation } from "./AnimationProvider";
import { FormattedMessage } from "react-intl";
import { RiPlayFill } from "react-icons/ri";
import PauseIcon from "./icons/PauseIcon";

const PauseResumeButton = () => {
  const { pause, isPaused, resume } = useAnimation();
  return isPaused ? (
    <Button
      variant="link"
      onClick={resume}
      leftIcon={<Icon as={RiPlayFill} />}
      borderRadius={0}
    >
      <FormattedMessage id="animation-resume-action" />
    </Button>
  ) : (
    <Button
      variant="link"
      onClick={pause}
      leftIcon={<PauseIcon />}
      borderRadius={0}
    >
      <FormattedMessage id="animation-pause-action" />
    </Button>
  );
};

export default PauseResumeButton;
