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
    }
  });
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
        aria-label={isRtl ? "Next slide group" : "Previous slide group"}
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
        aria-label={isRtl ? "Previous slide group" : "Next slide group"}
      />
    </>
  );
};

export default SwiperCarouselButtons;
