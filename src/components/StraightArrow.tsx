/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Icon, IconProps } from "@chakra-ui/react";

const StraightArrow = (props: IconProps) => {
  return (
    <Icon viewBox="0 0 90 36" w="88px" h="36px" aria-hidden {...props}>
      <path
        d="M4.58415 18.4756H84.7559"
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M72.0704 31.1611L84.7559 18.4756L72.0704 5.79009"
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
};

export default StraightArrow;
