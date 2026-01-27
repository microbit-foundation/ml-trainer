import React, { ReactNode } from "react";
import classNames from "classnames";
import styles from "./PlainButton.module.css";

interface PlainButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  renderLeft?: ReactNode;
  renderRight?: ReactNode;
}

const PlainButton = React.forwardRef(
  (
    {
      children,
      className,
      disabled,
      renderLeft,
      renderRight,
      type = "button",
      ...rest
    }: PlainButtonProps,
    ref?: React.Ref<HTMLButtonElement>
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={classNames(
          styles.root,
          {
            [`${styles.disabled}`]: disabled,
          },
          className
        )}
        disabled={disabled}
        {...rest}
      >
        <div className={styles.childrenContainer}>
          {renderLeft}
          {children}
          {renderRight}
        </div>
      </button>
    );
  }
);

PlainButton.displayName = "PlainButton";

export default PlainButton;
