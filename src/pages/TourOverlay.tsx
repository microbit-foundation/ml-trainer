/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, Portal, useModalContext, useToken } from "@chakra-ui/react";
import { MutableRefObject, RefObject, useLayoutEffect, useState } from "react";

interface TourOverlayProps extends SpotlightStyle {
  referenceRef: MutableRefObject<HTMLElement | undefined>;
}

/**
 * A replacement for Chakra UI's overlay that cuts out a section to highlight
 * some of the background. Suitable for onboarding tours.
 */
const TourOverlay = ({ referenceRef, ...clipStyle }: TourOverlayProps) => {
  const { isOpen } = useModalContext();
  const zIndex = useToken("zIndex", "overlay");
  const [overlay, cutOut] = useRects(referenceRef);
  if (!isOpen) {
    return null;
  }
  return (
    <Portal>
      <Box
        as="svg"
        zIndex={zIndex}
        position="fixed"
        left="0"
        top="0"
        w="100vw"
        h="100vh"
      >
        <g>
          <defs>
            {cutOut && (
              <clipPath id="mask">
                <path
                  clipRule="evenodd"
                  d={createClipPath(overlay, cutOut, clipStyle)}
                />
              </clipPath>
            )}
          </defs>
          <rect
            clipPath="url(#mask)"
            clipRule="evenodd"
            // Matches blackAlpha.600 which is what the regular modal uses.
            fill="000000"
            fillOpacity="0.48"
            height="100%"
            width="100%"
            x={0}
            y={0}
          />
        </g>
      </Box>
    </Portal>
  );
};

interface Rect {
  height: number;
  width: number;
  x: number;
  y: number;
}

const useRects = (ref: RefObject<HTMLElement | undefined>): Rect[] => {
  const [rects, setRects] = useState<Rect[]>([]);
  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (ref.current) {
        setRects([
          document.body.getBoundingClientRect(),
          ref.current.getBoundingClientRect(),
        ]);
      }
    });
    if (ref.current) {
      resizeObserver.observe(ref.current);
      resizeObserver.observe(document.body);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]);
  return rects;
};

const M = (x: number, y: number) => `M ${x} ${y}`;
const h = (x: number) => `h ${x}`;
const v = (y: number) => `v ${y}`;
const a = (r: number, x: number, y: number) => `a${r},${r} 0 0 1 ${x},${y}`;

export interface SpotlightStyle {
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingRight?: number;
  paddingLeft?: number;
}

const createClipPath = (overlay: Rect, cutOut: Rect, style: SpotlightStyle) => {
  const cornerRadius = 5;
  const pt = style.paddingTop ?? style.padding ?? 0;
  const pb = style.paddingBottom ?? style.padding ?? 0;
  const pr = style.paddingRight ?? style.padding ?? 0;
  const pl = style.paddingLeft ?? style.padding ?? 0;
  const px = pl + pr;
  const py = pt + pb;

  const paddedCutOut = {
    x: cutOut.x - pl + cornerRadius,
    y: cutOut.y - pt,
    width: cutOut.width + px - cornerRadius * 2,
    height: cutOut.height + py - cornerRadius * 2,
  };
  return [
    M(0, 0),
    h(overlay.width),
    v(overlay.height),
    h(-overlay.width),
    "z",
    M(paddedCutOut.x, paddedCutOut.y),
    h(paddedCutOut.width),
    a(cornerRadius, cornerRadius, cornerRadius),
    v(paddedCutOut.height),
    a(cornerRadius, -cornerRadius, cornerRadius),
    h(-paddedCutOut.width),
    a(cornerRadius, -cornerRadius, -cornerRadius),
    v(-paddedCutOut.height),
    a(cornerRadius, cornerRadius, -cornerRadius),
  ].join(" ");
};

export default TourOverlay;
