/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useCallback, useState, ReactNode } from "react";
import { RiFileCopy2Line, RiGithubFill } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import {
  AspectRatio,
  Box,
  Button,
  css,
  Grid,
  HStack,
  Icon,
  Image,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Text,
  VisuallyHidden,
  VStack,
} from "@microbit/ui";
import { useDeployment } from "../deployment";
import aarhusLogo from "../images/aulogo_uk_var2_blue.png";
import microbitHeartImage from "../images/microbit-heart.png";

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  finalFocusRef?: React.RefObject<HTMLButtonElement>;
}

/**
 * An about dialog with version information.
 */
const AboutDialog = ({ isOpen, onClose, finalFocusRef }: AboutDialogProps) => {
  const { appNameFull, OrgLogo } = useDeployment();
  const versionInfo = [
    {
      name: appNameFull,
      value: import.meta.env.VITE_VERSION,
      href: "https://github.com/microbit-foundation/ml-trainer",
    },
  ];

  const clipboardVersion = versionInfo
    .map((x) => `${x.name} ${x.value}`)
    .join("\n");

  const [hasCopied, setHasCopied] = useState(false);
  const onCopy = useCallback(() => {
    navigator.clipboard.writeText(clipboardVersion).then(
      () => {
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 1500);
      },
      // E.g. permission denied; give no feedback, like Chakra's useClipboard.
      () => {}
    );
  }, [clipboardVersion]);
  const intl = useIntl();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "full", md: "2xl" }}
      finalFocusRef={finalFocusRef}
    >
      <ModalBody>
        <ModalCloseButton />
        <VStack gap={8} pl={5} pr={5} pt={5}>
          <HStack justifyContent="center" gap={8}>
            {OrgLogo && <OrgLogo color="black" h="55px" />}
            <Image
              src={aarhusLogo}
              h="55px"
              alt={intl.formatMessage({ id: "aarhus-university-alt" })}
            />
          </HStack>
          <Text textAlign="center">
            <FormattedMessage
              id="about-dialog-title"
              values={{
                link: (chunks: ReactNode) => (
                  <Link
                    color="brand.600"
                    textDecoration="underline"
                    href="https://cctd.au.dk/"
                    target="_blank"
                    rel="noopener"
                  >
                    {chunks}
                  </Link>
                ),
              }}
            />
          </Text>
          <Grid columns={{ base: 1, md: 2 }} gap={8}>
            <Box>
              <AspectRatio
                ml="auto"
                mr="auto"
                ratio={690 / 562}
                maxWidth="388px"
              >
                <Image
                  src={microbitHeartImage}
                  alt={intl.formatMessage({ id: "about-dialog-alt" })}
                />
              </AspectRatio>
            </Box>
            <VStack alignItems="center" justifyContent="center" gap={4}>
              {/* One-off Chakra-style table (size sm); not worth a primitive
                  for a single two-cell layout. */}
              <table className={css({ borderCollapse: "collapse" })}>
                <caption
                  className={css({
                    captionSide: "top",
                    mt: 4,
                    px: 4,
                    py: 2,
                    fontSize: "xs",
                    fontFamily: "heading",
                    fontWeight: "medium",
                    textAlign: "center",
                    color: "gray.800",
                  })}
                >
                  <FormattedMessage id="software-versions" />
                </caption>
                <tbody>
                  {versionInfo.map((v) => (
                    <tr key={v.name}>
                      <td className={css(aboutTableCell)}>{v.name}</td>
                      <td className={css(aboutTableCell)}>{v.value}</td>
                      <td className={css(aboutTableCell, { padding: 0 })}>
                        {/* Move padding so we get a reasonable click target. */}
                        <Link
                          display="block"
                          pl={4}
                          pr={4}
                          pt={2}
                          pb={2}
                          target="_blank"
                          rel="noopener noreferrer"
                          href={v.href}
                        >
                          <Icon as={RiGithubFill} />
                          <VisuallyHidden>GitHub</VisuallyHidden>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button leftIcon={<RiFileCopy2Line />} onPress={onCopy} size="md">
                <FormattedMessage id={hasCopied ? "copied" : "copy-action"} />
              </Button>
            </VStack>
          </Grid>
        </VStack>
      </ModalBody>
      <ModalFooter>
        <Button onPress={onClose} variant="primary" size="lg">
          <FormattedMessage id="close-action" />
        </Button>
      </ModalFooter>
    </Modal>
  );
};

const aboutTableCell = {
  px: 4,
  py: 2,
  fontSize: "sm",
  lineHeight: 4,
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderColor: "gray.100",
} as const;

export default AboutDialog;
