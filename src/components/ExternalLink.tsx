/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { FormattedMessage } from "react-intl";
import { button } from "styled-system/recipes";
import { css, cx, Link } from "../shared-ui";

interface ExternalLinkProps {
  textId: string;
  href: string;
}

const ExternalLink = ({ textId, href }: ExternalLinkProps) => {
  return (
    <Link
      className={cx(
        button({ variant: "link" }),
        css({
          display: "flex",
          gap: 1,
          fontSize: "lg",
          alignItems: "center",
          flexDirection: "row",
        })
      )}
      href={href}
      target="_blank"
      rel="noopener"
    >
      <FormattedMessage id={textId} />
      {/* Chakra's ExternalLinkIcon glyph (MIT). */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className={css({
          width: "1em",
          height: "1em",
          display: "inline-block",
          flexShrink: 0,
        })}
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <path d="M15 3h6v6" />
          <path d="M10 14L21 3" />
        </g>
      </svg>
    </Link>
  );
};

export default ExternalLink;
