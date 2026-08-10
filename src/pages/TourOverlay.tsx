/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { css } from "@microbit/ui";

interface TourOverlayProps extends SpotlightStyle {
  /**
   * The element to spotlight, or null for no cut out.
   */
  reference: HTMLElement | null;
}

/**
 * A replacement for the modal backdrop that cuts out a section to highlight
 * some of the background. Suitable for onboarding tours.
 */
const TourOverlay = ({ reference, ...clipStyle }: TourOverlayProps) => {
  const [overlay, cutOut] = useRects(reference);
  return createPortal(
    <svg
      // Purely decorative: the spotlight can't be conveyed to assistive
      // technology, so the step's dialog names its target instead.
      aria-hidden="true"
      className={css({
        zIndex: "overlay",
        position: "fixed",
        left: 0,
        top: 0,
        w: "100vw",
        h: "100vh",
      })}
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
    </svg>,
    document.body
  );
};

interface Rect {
  height: number;
  width: number;
  x: number;
  y: number;
}

// Measure the element on each change of step, not just on mount: the overlay
// stays mounted for the whole tour so the spotlight has to follow the element.
const useRects = (element: HTMLElement | null): Rect[] => {
  const [rects, setRects] = useState<Rect[]>([]);
  useLayoutEffect(() => {
    if (!element) {
      setRects((previous) => (previous.length === 0 ? previous : []));
      return;
    }
    // Scroll the element into view before calculating rect.
    element.scrollIntoView({ behavior: "instant", inline: "nearest" });
    const resizeObserver = new ResizeObserver(() => {
      setRects([
        document.body.getBoundingClientRect(),
        element.getBoundingClientRect(),
      ]);
    });
    resizeObserver.observe(element);
    resizeObserver.observe(document.body);
    return () => {
      resizeObserver.disconnect();
    };
  }, [element]);
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
