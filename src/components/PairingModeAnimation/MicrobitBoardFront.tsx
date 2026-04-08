/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Icon, IconProps, useToken } from "@chakra-ui/react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { icons } from "../../utils/icons";
import { useAnimation } from "../AnimationProvider";

const dotGridPositions = [
  // Row 1 (y ≈ 47.94)
  [65.53, 47.94],
  [77.92, 47.96],
  [90.3, 47.99],
  [102.68, 48.01],
  [115.07, 48.03],
  // Row 2 (y ≈ 60.32)
  [65.51, 60.32],
  [77.89, 60.35],
  [90.27, 60.37],
  [102.66, 60.39],
  [115.04, 60.42],
  // Row 3 (y ≈ 72.71)
  [65.49, 72.71],
  [77.87, 72.73],
  [90.25, 72.75],
  [102.64, 72.78],
  [115.02, 72.8],
  // Row 4 (y ≈ 85.09)
  [65.47, 85.09],
  [77.85, 85.11],
  [90.23, 85.14],
  [102.61, 85.16],
  [115.0, 85.18],
  // Row 5 (y ≈ 97.47)
  [65.44, 97.47],
  [77.83, 97.49],
  [90.21, 97.51],
  [102.59, 97.54],
  [114.97, 97.57],
];

const clearGridSequence = [
  "1111111111110111111111111",
  "1111111011100011101111111",
  "1101110001000001000111011",
  "1000100000000000000010001",
  "0000000000000000000000000",
];

const bluetoothPattern = "0010000110101101011111111";

interface MicrobitBoardFrontProps extends IconProps {
  buttonStrokeColor?: string;
}

export interface MicrobitBoardFrontRef {
  playBluetoothPattern(): Promise<void>;
  reset(): void;
}

// Durations in sec.
const durations = {
  transition: 0.03,
  bluetoothIcon: 0.5,
  bluetoothPattern: 1,
};

export const MicrobitBoardFront = forwardRef<
  MicrobitBoardFrontRef,
  MicrobitBoardFrontProps
>(function MicrobitBoard(
  { buttonStrokeColor = "transparent", ...props }: MicrobitBoardFrontProps,
  ref
) {
  const { delayInSec } = useAnimation();
  const [ledPattern, setLedPattern] = useState<string>(icons.off);
  const [litLedColor, unlitLedColor] = useToken("colors", [
    "pink.500",
    "gray.500",
  ]);

  const [buttonStrokeFill] = useToken("colors", [buttonStrokeColor]);

  useImperativeHandle(
    ref,
    () => {
      return {
        async playBluetoothPattern() {
          setLedPattern(icons.off);
          await delayInSec(durations.transition);

          // Fill dot grid from left to right, row by row.
          for (let dotIdx = 0; dotIdx < dotGridPositions.length; dotIdx++) {
            const pattern = icons.off
              .split("")
              .map((_, i) => (i <= dotIdx ? 1 : 0))
              .join("");
            setLedPattern(pattern);
            await delayInSec(durations.transition);
          }

          // Clear grid sequence.
          for (
            let patternIdx = 0;
            patternIdx < clearGridSequence.length;
            patternIdx++
          ) {
            setLedPattern(clearGridSequence[patternIdx]);
            await delayInSec(durations.transition);
          }

          // Show Bluetooth icon.
          setLedPattern(icons.bluetooth);
          await delayInSec(durations.bluetoothIcon);

          // Show Bluetooth pattern.
          setLedPattern(bluetoothPattern);
          await delayInSec(durations.bluetoothPattern);
        },
        reset() {
          setLedPattern(icons.off);
        },
      };
    },
    [delayInSec]
  );
  return (
    <Icon viewBox="0 0 181 146" fill="none" {...props}>
      {/* Card outline */}
      <path
        d="M166.284 2.70146L14.4969 2.40504C7.95522 2.39482 2.64013 7.68947 2.62991 14.2311L2.40504 130.928C2.39482 137.47 7.68947 142.785 14.2311 142.795H19.3929C21.4883 139.555 25.8323 138.614 29.0827 140.72C29.9311 141.262 30.6466 141.987 31.1883 142.836L51.8149 142.877C53.9103 139.626 58.2544 138.686 61.5047 140.792C62.3531 141.333 63.0686 142.059 63.6103 142.907L84.237 142.948C86.3323 139.698 90.6764 138.758 93.9268 140.863C94.7751 141.405 95.4906 142.131 96.0324 142.979L116.659 143.02C118.754 139.769 123.098 138.829 126.349 140.935C127.197 141.476 127.913 142.202 128.454 143.05L149.081 143.091C151.176 139.841 155.52 138.901 158.771 141.006C159.619 141.548 160.335 142.274 160.876 143.122H166.048C172.59 143.142 177.905 137.848 177.915 131.306L178.14 14.6093C178.15 8.06766 172.856 2.75257 166.314 2.74235"
        fill="white"
      />
      <path
        d="M166.284 2.70146L14.4969 2.40504C7.95522 2.39482 2.64013 7.68947 2.62991 14.2311L2.40504 130.928C2.39482 137.47 7.68947 142.785 14.2311 142.795H19.3929C21.4883 139.555 25.8323 138.614 29.0827 140.72C29.9311 141.262 30.6466 141.987 31.1883 142.836L51.8149 142.877C53.9103 139.626 58.2544 138.686 61.5047 140.792C62.3531 141.333 63.0686 142.059 63.6103 142.907L84.237 142.948C86.3323 139.698 90.6764 138.758 93.9268 140.863C94.7751 141.405 95.4906 142.131 96.0324 142.979L116.659 143.02C118.754 139.769 123.098 138.829 126.349 140.935C127.197 141.476 127.913 142.202 128.454 143.05L149.081 143.091C151.176 139.841 155.52 138.901 158.771 141.006C159.619 141.548 160.335 142.274 160.876 143.122H166.048C172.59 143.142 177.905 137.848 177.915 131.306L178.14 14.6093C178.15 8.06766 172.856 2.75257 166.314 2.74235L166.284 2.70146Z"
        stroke="currentColor"
        strokeWidth="4.81"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom circles */}
      <path
        d="M162.011 120.881C162.011 124.755 158.853 127.892 154.979 127.882C151.105 127.882 147.967 124.724 147.977 120.85C147.977 116.976 151.135 113.838 155.009 113.848C158.883 113.848 162.021 117.007 162.011 120.881Z"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M129.599 120.819C129.599 124.693 126.441 127.831 122.567 127.821C118.693 127.821 115.555 124.662 115.565 120.789C115.565 116.915 118.724 113.777 122.597 113.787C126.471 113.787 129.609 116.945 129.599 120.819Z"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M97.1872 120.758C97.1872 124.632 94.0288 127.77 90.1549 127.77C86.281 127.77 83.1431 124.611 83.1431 120.737C83.1431 116.863 86.3015 113.726 90.1753 113.726C94.0492 113.726 97.1872 116.884 97.1769 120.758H97.1872Z"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M64.7653 120.696C64.7653 124.57 61.6069 127.708 57.733 127.708C53.8591 127.708 50.7212 124.55 50.7212 120.676C50.7212 116.802 53.8796 113.664 57.7535 113.664C61.6273 113.664 64.7653 116.823 64.7551 120.696H64.7653Z"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32.3432 120.635C32.3432 124.509 29.1848 127.647 25.3109 127.647C21.437 127.647 18.2991 124.489 18.2991 120.615C18.2991 116.741 21.4575 113.603 25.3313 113.603C29.2052 113.603 32.3432 116.761 32.3432 120.635Z"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Chip squares */}
      <path
        d="M146.683 59.8325L163.528 59.8627L163.527 59.8637C166.099 59.8655 168.108 61.9574 168.13 64.4467V64.4731L168.098 81.3178C168.096 83.8696 166.019 85.9194 163.493 85.9194H163.488L146.643 85.8881V85.8871C144.092 85.8844 142.043 83.8088 142.043 81.2827V81.2778L142.073 64.433C142.076 61.8618 144.168 59.8545 146.657 59.8325H146.683Z"
        fill="currentColor"
        stroke={buttonStrokeFill}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M163.493 83.4191L146.648 83.3884C145.483 83.3884 144.543 82.4378 144.543 81.2828L144.573 64.4381C144.573 63.2728 145.524 62.3427 146.679 62.3325L163.524 62.3631C164.689 62.3631 165.619 63.3137 165.629 64.4687L165.599 81.3135C165.599 82.4787 164.648 83.4191 163.493 83.4191Z"
        stroke="currentColor"
        strokeWidth="1.24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.0156 59.5874L33.8604 59.6177L33.8594 59.6187C36.4314 59.6205 38.4399 61.7124 38.4619 64.2017V64.228L38.4307 81.0728C38.4283 83.6246 36.3516 85.6743 33.8252 85.6743H33.8203L16.9756 85.6431V85.6421C14.4241 85.6394 12.375 83.5638 12.375 81.0376V81.0327L12.4053 64.188C12.408 61.6167 14.5005 59.6094 16.9893 59.5874H17.0156Z"
        fill="currentColor"
        stroke={buttonStrokeFill}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/* Chip circles */}
      <circle
        cx="155.09"
        cy="72.87"
        r="4.57"
        fill="white"
        stroke="white"
        strokeWidth="2.07"
      />
      <circle
        cx="25.43"
        cy="72.63"
        r="4.57"
        fill="white"
        stroke="white"
        strokeWidth="2.07"
      />
      {/* Corner triangles */}
      <path
        d="M50.803 3.28409L3.47827 50.1284L3.54982 12.3197C3.54982 7.28063 7.64857 3.20232 12.6877 3.21254L50.803 3.28409Z"
        fill="currentColor"
      />
      <path
        d="M73.2592 3.41675L49.3413 26.9462L49.4742 3.28387L73.2592 3.41675Z"
        fill="currentColor"
      />
      <path
        d="M83.6543 3.3861L71.7874 15.2224L71.8487 3.32477L83.6543 3.3861Z"
        fill="currentColor"
      />
      {/* Logo mark */}
      <path
        d="M96.6456 26.4865C97.586 26.4661 98.3321 25.6995 98.3117 24.7591C98.2912 23.8188 97.5247 23.0726 96.5843 23.0931C95.6644 23.1135 94.9284 23.8597 94.9182 24.7796C94.9182 25.7302 95.695 26.4968 96.6456 26.4865Z"
        fill="currentColor"
      />
      <path
        d="M83.8996 23.0214C82.9593 23.0418 82.2131 23.8186 82.2336 24.7488C82.254 25.6891 83.0308 26.4353 83.961 26.4148C84.8809 26.3944 85.6168 25.6482 85.627 24.7283C85.627 23.7777 84.8502 23.0214 83.8996 23.0214Z"
        fill="currentColor"
      />
      <path
        d="M83.9198 19.6791C81.1396 19.5974 78.8194 21.7949 78.7376 24.5751C78.6559 27.3553 80.8534 29.6756 83.6336 29.7574C83.7154 29.7574 83.787 29.7574 83.8687 29.7574L96.7885 29.8289C99.5687 29.9209 101.899 27.7335 101.991 24.9533C102.083 22.1731 99.8958 19.8427 97.1156 19.7507C97.0236 19.7507 96.9316 19.7507 96.8498 19.7507L83.9301 19.6791H83.9198ZM96.7578 33.1917L83.8381 33.1202C79.1976 33.1917 75.3748 29.5018 75.3033 24.8613C75.2317 20.2209 78.9216 16.3981 83.5621 16.3265C83.6847 16.3265 83.8074 16.3265 83.9301 16.3265L96.8396 16.3981C101.48 16.3163 105.313 20.0062 105.395 24.6467C105.477 29.2872 101.787 33.1202 97.1462 33.2019C97.0134 33.2019 96.8703 33.2019 96.7374 33.2019"
        fill="currentColor"
      />
      {/* Dot grid */}
      {dotGridPositions.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={parseInt(ledPattern[i]) ? 3 : 2}
          fill={parseInt(ledPattern[i]) ? litLedColor : unlitLedColor}
        />
      ))}
    </Icon>
  );
});
