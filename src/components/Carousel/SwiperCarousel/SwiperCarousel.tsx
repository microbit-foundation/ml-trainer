import React, { useCallback, useState } from "react";
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
import { useIntl } from "react-intl";

interface SwiperCarouselProps extends SwiperProps {
  carouselItems: JSX.Element[];
  containerMessageId: string;
  padding?: string | number;
  slideClassName?: string;
  swiperWrapperClassName?: string;
}

const swiperModules = [A11y, Autoplay, Navigation, Pagination];

const SwiperCarousel = ({
  carouselItems,
  containerMessageId,
  padding,
  navigation,
  slideClassName,
  swiperWrapperClassName,
  ...props
}: SwiperCarouselProps) => {
  const intl = useIntl();
  const isRtl = false;
  const [swiper, setSwiper] = useState<SwiperClass>();
  const handleSlideFocus = useCallback(
    (e: React.FocusEvent<HTMLElement, Element>) => {
      if (swiper) {
        swiper.slides.forEach((slide, i) => {
          if (slide.contains(e.target)) {
            swiper.activeIndex = i;
            swiper.updateSlidesClasses();
            swiper.slideTo(i);
          }
        });
      }
    },
    [swiper]
  );

  const handleSwiper = useCallback((swiper: SwiperClass) => {
    setSwiper(swiper);
    swiper.update();
  }, []);

  return (
    <div className={styles.carouselContainer}>
      <Swiper
        onSwiper={handleSwiper}
        style={{
          padding: padding ? padding : 0,
          alignItems: "stretch",
        }}
        dir={isRtl ? "rtl" : "ltr"}
        a11y={{
          enabled: true,
          slideRole: "presentation",
          containerRoleDescriptionMessage: intl.formatMessage({
            id: "carousel-role",
          }),
          itemRoleDescriptionMessage: intl.formatMessage({
            id: "carousel-slide-role",
          }),
          containerMessage: intl.formatMessage({ id: containerMessageId }),
          slideLabelMessage: intl.formatMessage(
            { id: "carousel-slide-label" },
            {
              slideNum: "{{index}}",
              totalSlides: "{{slidesLength}}",
            }
          ),
        }}
        modules={swiperModules}
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
