import React, { useCallback, useEffect, useState } from "react";
import { Swiper as SwiperClass } from "swiper";
import { A11y, Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperProps, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/a11y";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import "swiper/css/pagination";
import SwiperCarouselButtons from "../SwiperCarouselButtons/SwiperCarouselButtons";
import styles from "./SwiperCarousel.module.css";
import classNames from "classnames";

// Look at the following modules:
// Virtual slides - might be useful for performance

interface SwiperCarouselProps extends SwiperProps {
  carouselItems: JSX.Element[];
  itemTypeMessage: string;
  padding?: string | number;
  slideClassName?: string;
  swiperWrapperClassName?: string;
}

const SwiperCarousel = ({
  carouselItems,
  itemTypeMessage,
  padding,
  navigation,
  slideClassName,
  swiperWrapperClassName,
  ...props
}: SwiperCarouselProps) => {
  const isRtl = false;
  // FreeMode does not play well with button navigation.
  const modules = [A11y, Autoplay, Navigation, Pagination];
  const [swiper, setSwiper] = useState<SwiperClass>();
  useEffect(() => {
    if (swiper) {
      const listener = (e: KeyboardEvent) => {
        if (swiper.el.contains(document.activeElement)) {
          let indexUpdated = false;
          switch (e.key) {
            case "ArrowRight": {
              if (swiper.activeIndex === swiper.slides.length - 1) {
                break;
              }
              const incremented = swiper.activeIndex + 1;
              if (swiper.slides[incremented + 1]) {
                if (
                  !swiper.slides[incremented + 1].classList.contains(
                    "swiper-slide-visible"
                  )
                ) {
                  // This automatically updates the activeIndex.
                  swiper.slideNext();
                  swiper.slides[swiper.activeIndex].focus();
                  indexUpdated = true;
                }
              }
              if (!indexUpdated) {
                swiper.slides[++swiper.activeIndex].focus();
              }
              break;
            }
            case "ArrowLeft": {
              if (swiper.activeIndex === 0) {
                break;
              }
              const decremented = swiper.activeIndex - 1;
              if (swiper.slides[decremented - 1]) {
                if (
                  !swiper.slides[decremented - 1].classList.contains(
                    "swiper-slide-visible"
                  )
                ) {
                  // This automatically updates the activeIndex incorrectly
                  // for our purposes.
                  swiper.slidePrev();
                }
              }
              swiper.slides[decremented].focus();
              break;
            }
            default:
              break;
          }
        }
      };
      window.addEventListener("keydown", listener);
      return () => window.removeEventListener("keydown", listener);
    }
  }, [swiper]);

  const handleSlideFocus = useCallback(
    (e: React.FocusEvent<HTMLElement, Element>) => {
      if (swiper) {
        swiper.slides.forEach((slide, i) => {
          if (slide === e.target) {
            swiper.activeIndex = i;
            swiper.updateSlidesClasses();
          }
        });
      }
    },
    [swiper]
  );

  return (
    <div className={styles.carouselContainer}>
      <Swiper
        onSwiper={setSwiper}
        style={{
          padding: padding ? padding : 0,
          alignItems: "stretch",
        }}
        dir={isRtl ? "rtl" : "ltr"}
        a11y={{
          enabled: true,
          prevSlideMessage: "Previous slide",
          nextSlideMessage: "Next slide",
          slideRole: "presentation",
          containerRoleDescriptionMessage: "carousel",
          itemRoleDescriptionMessage: "slide",
          containerMessage: `List of ${itemTypeMessage}`,
          slideLabelMessage: "{{index}} of {{slidesLength}}",
        }}
        modules={modules}
        tag="ul"
        watchSlidesProgress
        wrapperClass={classNames(swiperWrapperClassName)}
        {...props}
      >
        {navigation && <SwiperCarouselButtons />}
        {carouselItems.map((item) => (
          <SwiperSlide
            key={item.key}
            className={classNames(slideClassName)}
            onFocus={handleSlideFocus}
            tag="li"
          >
            {item}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default SwiperCarousel;
