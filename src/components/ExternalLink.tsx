/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Button } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

interface ExternalLinkProps {
  textId: string;
  href: string;
}

const ExternalLink = ({ textId, href }: ExternalLinkProps) => {
  return (
    <Button
      variant="link"
      as="a"
      display="flex"
      gap={1}
      fontSize="lg"
      alignItems="center"
      flexDirection="row"
      href={href}
      target="_blank"
      rel="noopener"
    >
      <FormattedMessage id={textId} />
      <ExternalLinkIcon />
    </Button>
  );
};

export default ExternalLink;
