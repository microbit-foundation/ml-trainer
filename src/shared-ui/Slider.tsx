/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode } from "react";
import {
  Slider as RACSlider,
  SliderThumb,
  SliderTrack,
} from "react-aria-components";
import { css, cx } from "styled-system/css";
import { slider } from "styled-system/recipes";
import { SystemStyleObject } from "styled-system/types";

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  "aria-label": string;
  isDisabled?: boolean;
  /**
   * Number format for the value announced to assistive tech (e.g.
   * `{ style: "unit", unit: "percent" }` so units are heard, not bare
   * numbers).
   */
  formatOptions?: Intl.NumberFormatOptions;
  /** Per-instance style overrides, merged after the recipe. */
  css?: SystemStyleObject;
  trackCss?: SystemStyleObject;
  filledTrackCss?: SystemStyleObject;
  thumbCss?: SystemStyleObject;
  /**
   * Positioned at the current value along the track and shown while the
   * slider has focus (Chakra's SliderMark usage).
   */
  mark?: ReactNode;
  markCss?: SystemStyleObject;
}

/**
 * Slider — react-aria-components <Slider> styled like Chakra's horizontal md
 * slider.
 */
export const Slider = ({
  value,
  onChange,
  minValue = 0,
  maxValue = 100,
  "aria-label": ariaLabel,
  isDisabled,
  formatOptions,
  css: cssProp,
  trackCss,
  filledTrackCss,
  thumbCss,
  mark,
  markCss,
}: SliderProps) => {
  const slots = slider();
  const percent = ((value - minValue) / (maxValue - minValue)) * 100;
  return (
    <RACSlider
      value={value}
      onChange={onChange}
      minValue={minValue}
      maxValue={maxValue}
      aria-label={ariaLabel}
      isDisabled={isDisabled}
      formatOptions={formatOptions}
      className={cx(slots.root, cssProp ? css(cssProp) : undefined)}
    >
      {mark && (
        <div
          data-part="mark"
          className={cx(slots.mark, markCss ? css(markCss) : undefined)}
          style={{ left: `${percent}%` }}
        >
          {mark}
        </div>
      )}
      <SliderTrack
        className={cx(slots.track, trackCss ? css(trackCss) : undefined)}
      >
        <div
          className={cx(
            slots.filledTrack,
            filledTrackCss ? css(filledTrackCss) : undefined
          )}
          style={{ width: `${percent}%` }}
        />
      </SliderTrack>
      <SliderThumb
        className={cx(slots.thumb, thumbCss ? css(thumbCss) : undefined)}
      />
    </RACSlider>
  );
};
