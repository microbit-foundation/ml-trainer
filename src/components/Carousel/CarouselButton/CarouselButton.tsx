import React from "react";
import styles from "./CarouselButton.module.css";
import classNames from "classnames";
import ChevronLeftIcon from "../../icons/ChevronLeftIcon";
import ChevronRightIcon from "../../icons/ChevronRightIcon";

const CarouselButton = React.forwardRef(function CarouselButton(
  {
    className,
    direction,
    onClick,
    stroke,
    ...rest
  }: {
    direction: "left" | "right";
    className?: string;
    onClick?: () => void;
    stroke?: string;
  },
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  return (
    <button
      ref={ref}
      type="button"
      className={classNames(styles.root, className)}
      onClick={onClick}
      {...rest}
    >
      {direction === "left" ? (
        <ChevronLeftIcon className={styles.left} stroke={stroke} />
      ) : (
        <ChevronRightIcon className={styles.right} stroke={stroke} />
      )}
    </button>
  );
});

export default CarouselButton;
