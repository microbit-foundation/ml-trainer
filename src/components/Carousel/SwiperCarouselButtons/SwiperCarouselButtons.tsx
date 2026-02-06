import classNames from "classnames";
import { useEffect, useRef } from "react";
import { useSwiper } from "swiper/react";
import styles from "./SwiperCarouselButtons.module.css";
import CarouselButton from "../CarouselButton/CarouselButton";

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
    <>
      <CarouselButton
        ref={prevButtonRef}
        className={classNames(
          styles.carouselButton,
          isRtl ? styles.right : styles.left
        )}
        direction={isRtl ? "right" : "left"}
        size="large"
        onClick={() => swiper.slidePrev()}
      />
      <CarouselButton
        ref={nextButtonRef}
        className={classNames(
          styles.carouselButton,
          isRtl ? styles.left : styles.right
        )}
        direction={isRtl ? "left" : "right"}
        size="large"
        onClick={() => swiper.slideNext()}
      />
    </>
  );
};

export default SwiperCarouselButtons;
