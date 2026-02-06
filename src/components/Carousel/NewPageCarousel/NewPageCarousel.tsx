import { useCallback, useMemo } from "react";
import styles from "./NewPageCarousel.module.css";
import SwiperCarousel from "../SwiperCarousel/SwiperCarousel";

const slow = 3000;
const fast = 1000;

interface NewPageCarouselProps {
  carouselItems: JSX.Element[];
  containerMessageId: string;
  hero?: boolean;
  centerItems?: boolean;
}

const NewPageCarousel = ({
  carouselItems,
  containerMessageId,
  hero = false,
  centerItems = false,
}: NewPageCarouselProps) => {
  const getOffset = useCallback(
    (slidesPerGroup: number) => {
      if (centerItems && carouselItems.length <= slidesPerGroup) {
        return 0;
      }
      return (window.innerWidth / (slidesPerGroup + 0.4)) * 0.2;
    },
    [carouselItems.length, centerItems]
  );

  // Pass this in as a prop for other carousels?
  const breakpoints = useMemo(() => {
    if (typeof window === "undefined") {
      return;
    }
    return {
      // When window width is >= 0px.
      0: {
        slidesPerView: 2,
        spaceBetween: 15,
        slidesPerGroup: 2,
        slidesOffsetAfter: getOffset(2),
        slidesOffsetBefore: getOffset(2),
      },
      // When window width is >= 768px.
      768: {
        slidesPerView: 3,
        spaceBetween: 20,
        slidesPerGroup: 3,
        slidesOffsetAfter: getOffset(3),
        slidesOffsetBefore: getOffset(3),
      },
      // When window width is >= 992ppx.
      992: {
        slidesPerView: 4,
        spaceBetween: 25,
        slidesPerGroup: 4,
        slidesOffsetAfter: getOffset(4),
        slidesOffsetBefore: getOffset(4),
      },
      // When window width is >= 1200px.
      1200: {
        slidesPerView: 5,
        spaceBetween: 30,
        slidesPerGroup: 5,
        slidesOffsetAfter: getOffset(5),
        slidesOffsetBefore: getOffset(5),
      },
      // When window width is >= 1400px.
      1400: {
        slidesPerView: 6,
        spaceBetween: 30,
        slidesPerGroup: 6,
        slidesOffsetAfter: getOffset(6),
        slidesOffsetBefore: getOffset(6),
      },
    };
  }, [getOffset]);

  const getBreakpoint = useCallback(() => {
    if (typeof window !== "undefined" && breakpoints) {
      if (window.innerWidth < 768) {
        return breakpoints[0];
      } else if (window.innerWidth < 992) {
        return breakpoints[768];
      } else if (window.innerWidth < 1200) {
        return breakpoints[992];
      } else if (window.innerWidth < 1400) {
        return breakpoints[1200];
      } else {
        return breakpoints[1400];
      }
    }
  }, [breakpoints]);

  return (
    <SwiperCarousel
      autoHeight={hero}
      autoplay={
        hero
          ? {
              disableOnInteraction: true,
              delay: 10_000,
              pauseOnMouseEnter: true,
            }
          : false
      }
      breakpoints={
        hero
          ? {
              0: {
                slidesPerView: 1,
                spaceBetween: 0,
              },
            }
          : breakpoints
      }
      carouselItems={carouselItems}
      centerInsufficientSlides={centerItems}
      containerMessageId={containerMessageId}
      loop={hero}
      navigation={!hero}
      onResize={(swiper) => {
        if (hero || typeof window === "undefined") {
          return;
        }
        const breakpoint = getBreakpoint();
        if (breakpoint) {
          const offset = getOffset(breakpoint.slidesPerGroup);
          swiper.params.slidesOffsetAfter = offset;
          swiper.params.slidesOffsetBefore = offset;
        }
      }}
      // Padding to account for card box-shadow.
      padding={hero ? 0 : "1rem 12px 12px 12px"}
      speed={hero ? slow : fast}
      className={styles.root}
    />
  );
};
export default NewPageCarousel;
