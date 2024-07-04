import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
} from "@chakra-ui/modal";
import {
  AspectRatio,
  Box,
  Button,
  HStack,
  Icon,
  Image,
  Link,
  ModalCloseButton,
  SimpleGrid,
  Table,
  TableCaption,
  Tbody,
  Td,
  Text,
  Tr,
  VStack,
  VisuallyHidden,
  useClipboard,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { RiFileCopy2Line, RiGithubFill } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import aarhusLogo from "../images/aulogo_uk_var2_blue.png";
import microbitHeartImage from "../images/microbit-heart.png";
import MicrobitLogo from "./MicrobitLogo";

interface AboutDialogProps {
  appName: string;
  isOpen: boolean;
  onClose: () => void;
  finalFocusRef?: React.RefObject<HTMLButtonElement>;
}

/**
 * An about dialog with version information.
 */
const AboutDialog = ({
  isOpen,
  onClose,
  appName,
  finalFocusRef,
}: AboutDialogProps) => {
  const versionInfo = [
    {
      name: `micro:bit ${appName}`,
      value: import.meta.env.VITE_VERSION,
      href: "https://github.com/microbit-foundation/ml-trainer",
    },
  ];

  const clipboardVersion = versionInfo
    .map((x) => `${x.name} ${x.value}`)
    .join("\n");

  const { hasCopied, onCopy } = useClipboard(clipboardVersion);
  const intl = useIntl();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      finalFocusRef={finalFocusRef}
    >
      <ModalOverlay>
        <ModalContent>
          <ModalBody>
            <ModalCloseButton />
            <VStack spacing={8} pl={5} pr={5} pt={5}>
              <HStack justifyContent="center" gap={8}>
                <MicrobitLogo fill="#000" alt="micro:bit" height={55} />
                <Image src={aarhusLogo} h="55px" />
              </HStack>
              <Text textAlign="center">
                <FormattedMessage
                  id="about-dialog-title"
                  values={{
                    link: (chunks: ReactNode) => (
                      <Link
                        href="https://microbit.org"
                        target="_blank"
                        rel="noopener"
                        color="purple.500"
                      >
                        {chunks}
                      </Link>
                    ),
                  }}
                />
              </Text>
              <SimpleGrid columns={[1, 1, 2, 2]} spacing={8}>
                <Box>
                  <AspectRatio
                    ml="auto"
                    mr="auto"
                    ratio={690 / 562}
                    maxWidth={[388, 388, null, null]}
                  >
                    <Image
                      src={microbitHeartImage}
                      alt={intl.formatMessage({ id: "about-dialog-alt" })}
                    />
                  </AspectRatio>
                </Box>
                <VStack alignItems="center" justifyContent="center" spacing={4}>
                  <Table size="sm" sx={{ fontVariantNumeric: "unset" }}>
                    <Tbody>
                      {versionInfo.map((v) => (
                        <Tr key={v.name}>
                          <Td>{v.name}</Td>
                          <Td>{v.value}</Td>
                          <Td padding={0}>
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
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                    <TableCaption color="gray.800" placement="top">
                      <FormattedMessage id="software-versions" />
                    </TableCaption>
                  </Table>
                  <Button
                    leftIcon={<RiFileCopy2Line />}
                    onClick={onCopy}
                    size="md"
                  >
                    <FormattedMessage
                      id={hasCopied ? "copied" : "copy-action"}
                    />
                  </Button>
                </VStack>
              </SimpleGrid>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} variant="primary" size="lg">
              <FormattedMessage id="close-action" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default AboutDialog;
