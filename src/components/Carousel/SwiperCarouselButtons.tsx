/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useEffect, useRef } from "react";
import { useSwiper } from "swiper/react";
import { isNativePlatform } from "../../platform";
import { css, cx } from "../../shared-ui";
import CarouselButton from "./CarouselButton";

const SwiperCarouselButtons = () => {
  const isRtl = false;
  const swiper = useSwiper();
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const prevButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!swiper.destroyed && prevButtonRef.current && nextButtonRef.current) {
      swiper.navigation.prevEl = prevButtonRef.current;
      swiper.navigation.nextEl = nextButtonRef.current;
      swiper.navigation.update();
      swiper.navigation.nextEl.tabIndex = -1;
      swiper.navigation.prevEl.tabIndex = -1;
    }
  }, [swiper.destroyed, swiper.navigation]);

  // Override tab index on buttons. These are useless for keyboard users.
  // Just tab through the slide items/cards instead.
  useEffect(() => {
    const listener = () => {
      swiper.navigation.nextEl.tabIndex = -1;
      swiper.navigation.prevEl.tabIndex = -1;
    };
    if (!swiper.destroyed) {
      swiper.on("activeIndexChange", listener);
    }
    return () => {
      if (!swiper.destroyed) {
        swiper.off("activeIndexChange", listener);
      }
    };
  }, [swiper]);

  return (
    <div
      className={cx(
        css({
          "& .swiper-button-disabled": { display: "none" },
        }),
        isNativePlatform()
          ? css({ display: "none" })
          : css({ display: { base: "none", md: "contents" } })
      )}
    >
      <CarouselButton
        ref={prevButtonRef}
        aria-hidden
        side={isRtl ? "right" : "left"}
        direction={isRtl ? "right" : "left"}
        onClick={() => swiper.slidePrev()}
      />
      <CarouselButton
        ref={nextButtonRef}
        aria-hidden
        side={isRtl ? "left" : "right"}
        direction={isRtl ? "left" : "right"}
        onClick={() => swiper.slideNext()}
      />
    </div>
  );
};

export default SwiperCarouselButtons;
