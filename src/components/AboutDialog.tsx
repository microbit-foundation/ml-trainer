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
  Center,
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
  useClipboard,
  VStack,
} from "@chakra-ui/react";
import { RiFileCopy2Line } from "react-icons/ri";
import AppLogo from "./AppLogo";
import microbitHeartImage from "../images/microbit-heart.png";
import { FormattedMessage, useIntl } from "react-intl";
import { ReactNode } from "react";

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
              <Center>
                <AppLogo color="#000" as="h2" name={appName} />
              </Center>
              <Text fontSize="xl" fontFamily="GT Walsheim">
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
                        </Tr>
                      ))}
                    </Tbody>
                    <TableCaption
                      color="gray.800"
                      placement="top"
                      fontFamily="Helvetica Now"
                    >
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
