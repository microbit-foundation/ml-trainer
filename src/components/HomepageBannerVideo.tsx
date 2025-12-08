import {
  AspectRatio,
  Box,
  BoxProps,
  Button,
  Icon,
  useDisclosure,
} from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import HomepageBannerVideoTranscriptDialog from "./HomepageBannerVideoTranscriptDialog";

export interface HomepageBannerVideoProps {
  src: string;
}

const HomepageBannerVideo = ({ src }: HomepageBannerVideoProps) => {
  const intl = useIntl();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const textTranscriptDialog = useDisclosure();

  useEffect(() => {
    const video = videoRef.current;
    const listener = () => setIsPaused(false);
    if (video) {
      // Fires when video playback starts or resumes (including autoplay).
      // Autoplay requires page permission, element creation, and sufficient buffering.
      // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play_event
      video.addEventListener("play", listener);
    }
    return () => {
      if (video) {
        video.removeEventListener("play", listener);
      }
    };
  }, []);

  const handleTogglePlayPause = useCallback(async () => {
    if (videoRef.current?.paused) {
      await videoRef.current.play().catch((_e) => {
        // Do nothing. Continue to show video as paused.
      });
    } else {
      videoRef.current?.pause();
      setIsPaused(true);
    }
  }, []);

  return (
    <>
      <HomepageBannerVideoTranscriptDialog
        isOpen={textTranscriptDialog.isOpen}
        onClose={textTranscriptDialog.onClose}
      />
      <Box flex="1" width="100%">
        <AspectRatio
          ratio={1.05}
          width={{ base: "100%", sm: "80%" }}
          marginLeft="auto"
          marginRight={{ base: "auto", lg: "unset" }}
        >
          <Box flexDirection="column" overflow="visible !important">
            <Box position="relative">
              <Box
                as="button"
                opacity={isPaused ? 1 : 0}
                zIndex={2}
                onClick={handleTogglePlayPause}
                _hover={{
                  opacity: 1,
                }}
                _focusVisible={{
                  opacity: 1,
                  outline: 0,
                  boxShadow: "outline",
                }}
                position="absolute"
                height="100%"
                width="100%"
                backgroundColor="rgba(0,0,0,0.7)"
                display="flex"
                justifyContent="center"
                alignItems="center"
                aria-label={intl.formatMessage({
                  id: isPaused
                    ? "homepage-media-play-action"
                    : "homepage-media-pause-action",
                })}
              >
                <Icon as={isPaused ? PlayIcon : PauseIcon} boxSize={8} />
              </Box>
              <Box
                ref={videoRef}
                // Avoid keyboard navigable video element in Firefox.
                tabIndex={-1}
                as="video"
                autoPlay
                loop
                muted
                src={src}
                aria-label={intl.formatMessage({ id: "homepage-alt-media" })}
                borderWidth="4px"
                borderColor="rgba(245, 245, 245, 0.7)"
                boxSizing="border-box"
                borderBottom="none"
              />
            </Box>
            <Button
              mt={1}
              variant="link"
              fontSize="small"
              onClick={textTranscriptDialog.onOpen}
              textDecoration="underline"
            >
              <FormattedMessage id="homepage-media-description" />
            </Button>
          </Box>
        </AspectRatio>
      </Box>
    </>
  );
};

const PlayIcon = (props: BoxProps) => {
  return (
    <Box
      as="svg"
      role="img"
      viewBox="0 0 163 163"
      fill="currentColor"
      {...props}
    >
      <circle cx="81.5" cy="81.5" r="81.5" fill="white" />
      <path d="M57.0001 41L129.5 82L57 122L57.0001 41Z" fill="black" />
    </Box>
  );
};

const PauseIcon = (props: BoxProps) => {
  return (
    <Box
      as="svg"
      role="img"
      viewBox="0 0 163 163"
      fill="currentColor"
      {...props}
    >
      <circle cx="81.5" cy="81.5" r="81.5" fill="white" />
      <rect x="53" y="54" width="18" height="56" fill="black" />
      <rect x="89" y="54" width="18" height="56" fill="black" />
    </Box>
  );
};

export default HomepageBannerVideo;
