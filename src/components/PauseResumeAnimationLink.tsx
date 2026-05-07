import { Icon } from "@chakra-ui/react";
import { RiPlayFill } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { useAnimation } from "./AnimationProvider";
import DialogFooterLink from "./DialogFooterLink";
import PauseIcon from "./icons/PauseIcon";

const PauseResumeLink = () => {
  const { pause, isPaused, resume } = useAnimation();
  return isPaused ? (
    <DialogFooterLink onClick={resume} leftIcon={<Icon as={RiPlayFill} />}>
      <FormattedMessage id="animation-resume-action" />
    </DialogFooterLink>
  ) : (
    <DialogFooterLink onClick={pause} leftIcon={<PauseIcon />}>
      <FormattedMessage id="animation-pause-action" />
    </DialogFooterLink>
  );
};

export default PauseResumeLink;
