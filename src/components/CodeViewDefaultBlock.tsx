import { FormattedMessage, useIntl } from "react-intl";
import { MakeCodeIcon, makecodeIcons } from "../utils/icons";
import { Box } from "@chakra-ui/react";
interface CodeViewDefaultBlockProps {
  gestureName: string;
  icon: MakeCodeIcon;
}

const CodeViewDefaultBlock = ({
  gestureName,
  icon,
}: CodeViewDefaultBlockProps) => {
  const intl = useIntl();
  const ledPattern = makecodeIcons[icon];
  const iconName = intl.formatMessage({
    id: `led-icon-option-${icon.toLocaleLowerCase()}`,
  });
  const gestureNameTextBoxWidth = getGestureNameTextBoxWidth(gestureName);
  const dropdownArrowXPos = gestureNameTextBoxWidth - 20;
  const onMlStartBlockWidth = gestureNameTextBoxWidth + 120;
  const startTextXPos = onMlStartBlockWidth - 50;
  return (
    <Box
      role="image"
      aria-label={intl.formatMessage(
        { id: "makecode-block-default-alt" },
        { actionName: gestureName, iconName }
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        height="100"
        viewBox="0 0 550 145"
      >
        <defs>
          <pattern width="100" height="100" x="0" y="0">
            <line strokeWidth="1" x1="0" y1="0.5" x2="1" y2="0.5" />
          </pattern>
        </defs>
        <g>
          <g transform="translate(-20, -20) scale(1)">
            <g transform="translate(20,20)">
              <path
                stroke="#204b92"
                fill="#2b64c3"
                d={`m 0,0  m 0,4 a 4 4 0 0,1 4,-4  h ${onMlStartBlockWidth} a 4 4 0 0,1 4,4  v 4  V 8  V 43  V 47 a 4 4 0 0,1 -4,4  H 64  c -2,0  -3,1  -4,2  l -4,4  c -1,1  -2,2  -4,2  h -12  c -2,0  -3,-1  -4,-2  l -4,-4  c -1,-1  -2,-2  -4,-2  h -8 a 4 4 0 0,0 -4,4  v 54 a 4 4 0 0,0 4,4  h 8  c 2,0  3,1  4,2  l 4,4  c 1,1  2,2  4,2  h 12  c 2,0  3,-1  4,-2  l 4,-4  c 1,-1  2,-2  4,-2  H ${
                  onMlStartBlockWidth + 4
                } a 4 4 0 0,1 4,4  V 121  V 141 a 4 4 0 0,1 -4,4  h -${onMlStartBlockWidth} a 4 4 0 0,1 -4,-4`}
              />
              <g display="block" transform="translate(16,51)">
                <path
                  stroke="#176cbf"
                  fill="#1e90ff"
                  d="m 0,0  m 0,4 a 4 4 0 0,1 4,-4  h 8  c 2,0  3,1  4,2  l 4,4  c 1,1  2,2  4,2  h 12  c 2,0  3,-1  4,-2  l 4,-4  c 1,-1  2,-2  4,-2  h 130.4140625 a 4 4 0 0,1 4,4  v 8  V 54  V 58  V 58 a 4 4 0 0,1 -4,4  h -130.4140625  c -2,0  -3,1  -4,2  l -4,4  c -1,1  -2,2  -4,2  h -12  c -2,0  -3,-1  -4,-2  l -4,-4  c -1,-1  -2,-2  -4,-2  h -8 a 4 4 0 0,1 -4,-4 z&#10;"
                />
                <g transform="translate(8,20)">
                  <text
                    dominantBaseline="central"
                    x="0"
                    y="11"
                    fontSize="12pt"
                    fontWeight={600}
                    fontFamily={`"Monaco", "Menlo", "Ubuntu Mono", "Consolas", "source-code-pro", monospace`}
                    fill="white"
                  >
                    <FormattedMessage id="makecode-block-show-icon" />
                  </text>
                </g>
                <g transform="translate(102.4140625,8)">
                  <rect
                    rx="4"
                    ry="4"
                    x="0"
                    y="0"
                    height="46"
                    width="72"
                    stroke="#176cbf"
                    fill="transparent"
                  />
                  <text
                    dominantBaseline="central"
                    textAnchor="end"
                    x="64"
                    y="23"
                  />
                  <BlockLedMatrixInternalSvg ledPattern={ledPattern} />
                  <use
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    height="12px"
                    width="12px"
                    xlinkHref="#blocklyDropdownArrowSvgundefined"
                    transform="translate(52,17)"
                  />
                </g>
              </g>
              <g transform="translate(8,14.5)">
                <text
                  dominantBaseline="central"
                  x="0"
                  y="11"
                  fontSize="12pt"
                  fontWeight={600}
                  fontFamily={`"Monaco", "Menlo", "Ubuntu Mono", "Consolas", "source-code-pro", monospace`}
                  fill="white"
                >
                  <FormattedMessage id="makecode-block-on-ML" />
                </text>
              </g>
              <g
                data-argument-type="dropdown"
                transform="translate(64.0078125,8)"
              >
                <rect
                  rx="4"
                  ry="4"
                  x="0"
                  y="0"
                  height="35"
                  width={`${gestureNameTextBoxWidth}`}
                  stroke="#204b92"
                  fill="transparent"
                />
                <text
                  dominantBaseline="central"
                  textAnchor="start"
                  x="10"
                  y="17.5"
                  fontSize="12pt"
                  fontWeight={600}
                  fontFamily={`"Monaco", "Menlo", "Ubuntu Mono", "Consolas", "source-code-pro", monospace`}
                  fill="white"
                >
                  {gestureName}
                </text>
                <use
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  height="12px"
                  width="12px"
                  xlinkHref="#blocklyDropdownArrowSvgundefined"
                  transform={`translate(${dropdownArrowXPos},11.5)`}
                />
              </g>
              <g transform={`translate(${startTextXPos},14.5)`}>
                <text
                  dominantBaseline="central"
                  x="0"
                  y="11"
                  fontSize="12pt"
                  fontWeight={600}
                  fontFamily={`"Monaco", "Menlo", "Ubuntu Mono", "Consolas", "source-code-pro", monospace`}
                  fill="white"
                >
                  <FormattedMessage id="makecode-block-start" />
                </text>
              </g>
            </g>
          </g>
          <g transform="translate(-20, -20) scale(1)" />
          <defs>
            <image
              xmlnsXlink="http://www.w3.org/1999/xlink"
              id="blocklyDropdownArrowSvgundefined"
              height="12px"
              width="12px"
              xlinkHref="data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMi43MSIgaGVpZ2h0PSI4Ljc5IiB2aWV3Qm94PSIwIDAgMTIuNzEgOC43OSI+PHRpdGxlPmRyb3Bkb3duLWFycm93PC90aXRsZT48ZyBvcGFjaXR5PSIwLjEiPjxwYXRoIGQ9Ik0xMi43MSwyLjQ0QTIuNDEsMi40MSwwLDAsMSwxMiw0LjE2TDguMDgsOC4wOGEyLjQ1LDIuNDUsMCwwLDEtMy40NSwwTDAuNzIsNC4xNkEyLjQyLDIuNDIsMCwwLDEsMCwyLjQ0LDIuNDgsMi40OCwwLDAsMSwuNzEuNzFDMSwwLjQ3LDEuNDMsMCw2LjM2LDBTMTEuNzUsMC40NiwxMiwuNzFBMi40NCwyLjQ0LDAsMCwxLDEyLjcxLDIuNDRaIiBmaWxsPSIjMjMxZjIwIi8+PC9nPjxwYXRoIGQ9Ik02LjM2LDcuNzlhMS40MywxLjQzLDAsMCwxLTEtLjQyTDEuNDIsMy40NWExLjQ0LDEuNDQsMCwwLDEsMC0yYzAuNTYtLjU2LDkuMzEtMC41Niw5Ljg3LDBhMS40NCwxLjQ0LDAsMCwxLDAsMkw3LjM3LDcuMzdBMS40MywxLjQzLDAsMCwxLDYuMzYsNy43OVoiIGZpbGw9IiNmZmYiLz48L3N2Zz4="
            />
          </defs>
        </g>
      </svg>
    </Box>
  );
};

const blockFont = `600 12pt "Monaco", "Menlo", "Ubuntu Mono", "Consolas", "source-code-pro", monospace`;
const getGestureNameTextBoxWidth = (text: string) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context!.font = blockFont;
  const textBoxPaddingWidth = 40;
  return context!.measureText(text).width + textBoxPaddingWidth;
};

interface BlockLedMatrixInternalSvgProps {
  ledPattern: string;
}

const BlockLedMatrixInternalSvg = ({
  ledPattern,
}: BlockLedMatrixInternalSvgProps) => {
  const initalPos = { x: 9, y: 6 };
  return [...ledPattern].map((led: string, idx: number) => (
    <rect
      key={idx}
      rx="1"
      ry="1"
      x={initalPos.x + (idx % 5) * 7}
      y={initalPos.y + Math.floor(idx * 0.2) * 7}
      height="5"
      width="5"
      fill={led === "0" ? "#226ac8" : "white"}
    />
  ));
};

export default CodeViewDefaultBlock;
