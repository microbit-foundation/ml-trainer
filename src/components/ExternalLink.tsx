/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { RiExternalLinkLine } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { button } from "styled-system/recipes";
import { css, cx, Icon, Link } from "../shared-ui";

interface ExternalLinkProps {
  textId: string;
  href: string;
  /**
   * Text size matching the footer's button size — lg alongside the usual
   * size="lg" dialog buttons, md alongside md ones (e.g. LanguageDialog).
   */
  size?: "md" | "lg";
}

const ExternalLink = ({ textId, href, size = "lg" }: ExternalLinkProps) => {
  return (
    <Link
      className={cx(
        button({ variant: "link" }),
        css({
          display: "flex",
          gap: 1,
          fontSize: size === "md" ? "md" : "lg",
          alignItems: "center",
          // The button recipe centres content, which shows when the link is
          // a full-width block (mid-dialog) rather than shrink-wrapped.
          justifyContent: "flex-start",
          flexDirection: "row",
        })
      )}
      href={href}
      target="_blank"
      rel="noopener"
    >
      <FormattedMessage id={textId} />
      <Icon as={RiExternalLinkLine} aria-hidden />
    </Link>
  );
};

export default ExternalLink;
