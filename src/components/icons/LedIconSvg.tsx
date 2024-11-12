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
        <rect
          id="Rectangle_1"
          data-name="Rectangle 1"
          width="14.41"
          height="14.41"
          rx="2"
          fill={getFill(iconData[0])}
        />
        <rect
          id="Rectangle_3"
          data-name="Rectangle 3"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(16.41 0)"
          fill={getFill(iconData[1])}
        />
        <rect
          id="Rectangle_4"
          data-name="Rectangle 4"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(32.82 0)"
          fill={getFill(iconData[2])}
        />
        <rect
          id="Rectangle_5"
          data-name="Rectangle 5"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(49.23 0)"
          fill={getFill(iconData[3])}
        />
        <rect
          id="Rectangle_6"
          data-name="Rectangle 6"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(65.64 0)"
          fill={getFill(iconData[4])}
        />
        <rect
          id="Rectangle_7"
          data-name="Rectangle 7"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(0 16.41)"
          fill={getFill(iconData[5])}
        />
        <rect
          id="Rectangle_8"
          data-name="Rectangle 8"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(16.41 16.41)"
          fill={getFill(iconData[6])}
        />
        <rect
          id="Rectangle_9"
          data-name="Rectangle 9"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(32.82 16.41)"
          fill={getFill(iconData[7])}
        />
        <rect
          id="Rectangle_10"
          data-name="Rectangle 10"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(49.23 16.41)"
          fill={getFill(iconData[8])}
        />
        <rect
          id="Rectangle_11"
          data-name="Rectangle 11"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(65.64 16.41)"
          fill={getFill(iconData[9])}
        />
        <rect
          id="Rectangle_12"
          data-name="Rectangle 12"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(0 32.82)"
          fill={getFill(iconData[10])}
        />
        <rect
          id="Rectangle_13"
          data-name="Rectangle 13"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(16.41 32.82)"
          fill={getFill(iconData[11])}
        />
        <rect
          id="Rectangle_14"
          data-name="Rectangle 14"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(32.82 32.82)"
          fill={getFill(iconData[12])}
        />
        <rect
          id="Rectangle_15"
          data-name="Rectangle 15"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(49.23 32.82)"
          fill={getFill(iconData[13])}
        />
        <rect
          id="Rectangle_16"
          data-name="Rectangle 16"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(65.64 32.82)"
          fill={getFill(iconData[14])}
        />
        <rect
          id="Rectangle_17"
          data-name="Rectangle 17"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(0 49.23)"
          fill={getFill(iconData[15])}
        />
        <rect
          id="Rectangle_18"
          data-name="Rectangle 18"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(16.41 49.23)"
          fill={getFill(iconData[16])}
        />
        <rect
          id="Rectangle_19"
          data-name="Rectangle 19"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(32.82 49.23)"
          fill={getFill(iconData[17])}
        />
        <rect
          id="Rectangle_20"
          data-name="Rectangle 20"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(49.23 49.23)"
          fill={getFill(iconData[18])}
        />
        <rect
          id="Rectangle_21"
          data-name="Rectangle 21"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(65.64 49.23)"
          fill={getFill(iconData[19])}
        />
        <rect
          id="Rectangle_22"
          data-name="Rectangle 22"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(0 65.64)"
          fill={getFill(iconData[20])}
        />
        <rect
          id="Rectangle_23"
          data-name="Rectangle 23"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(16.41 65.64)"
          fill={getFill(iconData[21])}
        />
        <rect
          id="Rectangle_24"
          data-name="Rectangle 24"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(32.82 65.64)"
          fill={getFill(iconData[22])}
        />
        <rect
          id="Rectangle_25"
          data-name="Rectangle 25"
          width="14.41"
          height="14.41"
          rx="2"
          transform="translate(49.23 65.64)"
          fill={getFill(iconData[23])}
        />
        <rect
          id="Rectangle_26"
          data-name="Rectangle 26"
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
