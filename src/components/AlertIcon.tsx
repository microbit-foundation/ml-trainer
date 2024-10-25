import { Icon, IconProps } from "@chakra-ui/react";

interface AlertIconProps extends Omit<IconProps, "viewBox"> {}

const AlertIcon = ({ ...props }: AlertIconProps) => {
  return (
    <Icon stroke-width="0" viewBox="0 0 24 24" {...props}>
      <path
        d="M12.8659 3.00017L22.3922 19.5002C22.6684 19.9785 22.5045 20.5901 22.0262 20.8662C21.8742 20.954 21.7017 21.0002 21.5262 21.0002H2.47363C1.92135 21.0002 1.47363 20.5525 1.47363 20.0002C1.47363 19.8246 1.51984 19.6522 1.60761 19.5002L11.1339 3.00017C11.41 2.52187 12.0216 2.358 12.4999 2.63414C12.6519 2.72191 12.7782 2.84815 12.8659 3.00017ZM10.9999 16.0002V18.0002H12.9999V16.0002H10.9999ZM10.9999 9.00017V14.0002H12.9999V9.00017H10.9999Z"
        id="path1"
      />
      <path
        fill="black"
        stroke="none"
        d="M 91.949153,95.762712 V 75 H 100 108.05085 V 95.762712 116.52542 H 100 91.949153 Z"
        id="path2"
        transform="scale(0.12)"
      />
      <path
        fill="black"
        stroke="none"
        d="m 91.949153,141.52542 v -8.05084 H 100 h 8.05085 v 8.05084 8.05085 H 100 91.949153 Z"
        id="path3"
        transform="scale(0.12)"
      />
    </Icon>
  );
};

export default AlertIcon;
