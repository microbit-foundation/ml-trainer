/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Icon } from "@chakra-ui/react";

interface UpCurveArrowProps {
  w: string;
  h: string;
  color?: string;
}

const UpCurveArrow = ({ w, h, color }: UpCurveArrowProps) => {
  return (
    <Icon w={w} h={h} viewBox="0 0 71.079 110" color={color} aria-hidden>
      <path
        d="M67.124,54.2A54.615,54.615,0,0,1,8.246,8.119l-4.09,5.064a2.307,2.307,0,0,1-3.279.349,2.307,2.307,0,0,1-.349-3.279L8.1.877A2.307,2.307,0,0,1,11.379.528L20.756,8.1a2.363,2.363,0,0,1,.349,3.279,2.307,2.307,0,0,1-3.279.349l-4.9-3.957A49.72,49.72,0,0,0,66.55,49.5a2.428,2.428,0,0,1,1.736.555,2.854,2.854,0,0,1,.9,1.547,2.162,2.162,0,0,1-.422,1.694,2.349,2.349,0,0,1-1.643.9"
        transform="translate(0 0)"
        fill="currentColor"
      />
    </Icon>
  );
};

export default UpCurveArrow;
