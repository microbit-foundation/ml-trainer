import { useToken } from "@chakra-ui/react";
import { icons, LedIconType } from "../../utils/icons";
import { useCallback } from "react";

interface LedIconSvg {
  icon: LedIconType;
}

const LedIconSvg = ({ icon }: LedIconSvg) => {
  const [brand500, gray200] = useToken("colors", ["brand.500", "gray.200"]);
  const iconData = icons[icon];
  const getFill = useCallback(
    (value: string) => {
      return value === "1" ? brand500 : gray200;
    },
    [brand500, gray200]
  );
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="80.05"
      height="80.05"
      viewBox="0 0 80.05 80.05"
    >
      <g>
        <rect width="14.41" height="14.41" rx="2" fill={getFill(iconData[0])} />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(16.41 0)"
          fill={getFill(iconData[1])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(32.82 0)"
          fill={getFill(iconData[2])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(49.23 0)"
          fill={getFill(iconData[3])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(65.64 0)"
          fill={getFill(iconData[4])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(0 16.41)"
          fill={getFill(iconData[5])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(16.41 16.41)"
          fill={getFill(iconData[6])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(32.82 16.41)"
          fill={getFill(iconData[7])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(49.23 16.41)"
          fill={getFill(iconData[8])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(65.64 16.41)"
          fill={getFill(iconData[9])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(0 32.82)"
          fill={getFill(iconData[10])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(16.41 32.82)"
          fill={getFill(iconData[11])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(32.82 32.82)"
          fill={getFill(iconData[12])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(49.23 32.82)"
          fill={getFill(iconData[13])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(65.64 32.82)"
          fill={getFill(iconData[14])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(0 49.23)"
          fill={getFill(iconData[15])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(16.41 49.23)"
          fill={getFill(iconData[16])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(32.82 49.23)"
          fill={getFill(iconData[17])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(49.23 49.23)"
          fill={getFill(iconData[18])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(65.64 49.23)"
          fill={getFill(iconData[19])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(0 65.64)"
          fill={getFill(iconData[20])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(16.41 65.64)"
          fill={getFill(iconData[21])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(32.82 65.64)"
          fill={getFill(iconData[22])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(49.23 65.64)"
          fill={getFill(iconData[23])}
        />
        <rect
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(65.64 65.64)"
          fill={getFill(iconData[24])}
        />
      </g>
    </svg>
  );
};
export default LedIconSvg;
