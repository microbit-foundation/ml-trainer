import { useCallback, useMemo } from "react";
import SwiperCarousel from "../SwiperCarousel/SwiperCarousel";
import styles from "./NewPageCarousel.module.css";
import { SwiperClass } from "swiper/react";

const slow = 3000;
const fast = 1000;
const cardWidth = 260;
const mobileSpaceBetween = 15;

interface NewPageCarouselProps {
  carouselItems: JSX.Element[];
  containerMessageId: string;
  hero?: boolean;
  centerItems?: boolean;
  padding?: string | number;
}

const defaultPadding = "1rem 12px 12px 12px";

const NewPageCarousel = ({
  carouselItems,
  containerMessageId,
  hero = false,
  centerItems = false,
  padding,
}: NewPageCarouselProps) => {
  const resolvedPadding = padding ?? (hero ? 0 : defaultPadding);
  const getOffset = useCallback(
    (slidesPerGroup: number) => {
      if (centerItems && carouselItems.length <= slidesPerGroup) {
        return 0;
      }
      return (window.innerWidth / (slidesPerGroup + 0.4)) * 0.2;
    },
    [carouselItems.length, centerItems]
  );

  const getSlidesPerGroup = useCallback((spacing: number) => {
    // 24px padding left/right.
    return Math.floor((window.innerWidth - 24) / (cardWidth + spacing));
  }, []);

  // Pass this in as a prop for other carousels?
  const breakpoints = useMemo(() => {
    if (typeof window === "undefined") {
      return;
    }

    return {
      // When window width is >= 0px.
      0: {
        spaceBetween: mobileSpaceBetween,
        slidesPerGroup: 1,
        slidesOffsetAfter: 0,
        slidesOffsetBefore: 0,
      },
      // When window width is >= 768px.
      768: {
        spaceBetween: 20,
        slidesPerGroup: getSlidesPerGroup(20),
        slidesOffsetAfter: getOffset(getSlidesPerGroup(20)),
        slidesOffsetBefore: getOffset(getSlidesPerGroup(20)),
      },
      // When window width is >= 992px.
      992: {
        spaceBetween: 25,
        slidesPerGroup: getSlidesPerGroup(25),
        slidesOffsetAfter: getOffset(getSlidesPerGroup(25)),
        slidesOffsetBefore: getOffset(getSlidesPerGroup(25)),
      },
      // When window width is >= 1200px.
      1200: {
        spaceBetween: 30,
        slidesPerGroup: getSlidesPerGroup(30),
        slidesOffsetAfter: getOffset(getSlidesPerGroup(30)),
        slidesOffsetBefore: getOffset(getSlidesPerGroup(30)),
      },
      // When window width is >= 1400px.
      1400: {
        spaceBetween: 30,
        slidesPerGroup: getSlidesPerGroup(30),
        slidesOffsetAfter: getOffset(getSlidesPerGroup(30)),
        slidesOffsetBefore: getOffset(getSlidesPerGroup(30)),
      },
    };
  }, [getOffset, getSlidesPerGroup]);

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

  const recalculateBreakpoints = useCallback(
    (swiper: SwiperClass) => {
      if (hero || typeof window === "undefined") {
        return;
      }
      const breakpoint = getBreakpoint();
      if (breakpoint) {
        let slidesPerGroup = breakpoint.slidesPerGroup;
        let offset = breakpoint.slidesOffsetAfter;
        if (breakpoint.spaceBetween !== mobileSpaceBetween) {
          slidesPerGroup = getSlidesPerGroup(breakpoint.spaceBetween);
          offset = getOffset(slidesPerGroup);
        }
        swiper.params.slidesOffsetAfter = offset;
        swiper.params.slidesOffsetBefore = offset;
        swiper.params.slidesPerGroup = slidesPerGroup;
      }
    },
    [getBreakpoint, getOffset, getSlidesPerGroup, hero]
  );

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
      slidesPerView="auto"
      carouselItems={carouselItems}
      centerInsufficientSlides={centerItems}
      containerMessageId={containerMessageId}
      loop={hero}
      navigation={!hero}
      onResize={recalculateBreakpoints}
      onInit={recalculateBreakpoints}
      padding={resolvedPadding}
      speed={hero ? slow : fast}
      className={styles.root}
    />
  );
};
export default NewPageCarousel;
