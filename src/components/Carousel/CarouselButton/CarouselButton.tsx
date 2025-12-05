import React from "react";
import styles from "./CarouselButton.module.css";
import classNames from "classnames";
import ChevronLeftIcon from "../../icons/ChevronLeftIcon";
import ChevronRightIcon from "../../icons/ChevronRightIcon";
import PlainButton from "../PlainButton/PlainButton";

const CarouselButton = React.forwardRef(
  (
    {
      className,
      direction,
      onClick,
      size = "small",
      shadow = true,
      stroke,
      ...rest
    }: {
      direction: "left" | "right";
      className?: string;
      onClick?: () => void;
      size?: "small" | "large";
      shadow?: boolean;
      stroke?: string;
    },
    ref: React.ForwardedRef<HTMLButtonElement>
  ) => (
    <PlainButton
      ref={ref}
      className={classNames(
        styles.root,
        styles[size],
        shadow && "shadow",
        className
      )}
      onClick={onClick}
      {...rest}
    >
      {direction === "left" ? (
        <ChevronLeftIcon className={styles.left} stroke={stroke} />
      ) : (
        <ChevronRightIcon className={styles.right} stroke={stroke} />
      )}
    </PlainButton>
  )
);

CarouselButton.displayName = "CarouselButton";

export default CarouselButton;
