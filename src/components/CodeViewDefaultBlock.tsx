interface CodeViewDefaultBlockProps {
  gestureName: string;
  icon: string;
}

const CodeViewDefaultBlock = ({ gestureName }: CodeViewDefaultBlockProps) => {
  // Work out ledPattern from icon
  const ledPattern = "0101011111111110111000100";
  const gestureNameTextBoxWidth = getGestureNameTextBoxWidth(gestureName);
  const dropdownArrowXPos = gestureNameTextBoxWidth - 20;
  const svgWidth = gestureNameTextBoxWidth + 100;
  const onMlStartBlockWidth = gestureNameTextBoxWidth + 120;
  const startTextXPos = onMlStartBlockWidth - 50;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      width={`${svgWidth}`}
      height="145"
      viewBox={`0 0 ${svgWidth} 145`}
      className="pxt-renderer classNameic-theme"
    >
      <defs>
        <pattern
          id="blocklyGridPattern27719798250106775"
          patternUnits="userSpaceOnUse"
          width="100"
          height="100"
          x="0"
          y="0"
        >
          <line strokeWidth="1" x1="0" y1="0.5" x2="1" y2="0.5" />
        </pattern>
      </defs>
      <g className="blocklyWorkspace">
        <g
          className="blocklyBlockCanvas"
          transform="translate(-20, -20) scale(1)"
        >
          <g className="blocklyCursor">
            <g width="80" height="5">
              <rect width="80" height="5" display="none">
                <animate
                  attributeType="XML"
                  attributeName="fill"
                  dur="1s"
                  values="#ffa200;transparent;transparent;"
                  repeatCount="indefinite"
                />
              </rect>
              <rect
                className="blocklyVerticalMarker"
                rx="10"
                ry="10"
                display="none"
              />
              <path transform="" display="none">
                <animate
                  attributeType="XML"
                  attributeName="fill"
                  dur="1s"
                  values="#ffa200;transparent;transparent;"
                  repeatCount="indefinite"
                />
              </path>
              <path transform="" display="none" fill="none" strokeWidth="4">
                <animate
                  attributeType="XML"
                  attributeName="stroke"
                  dur="1s"
                  values="#ffa200;transparent;transparent;"
                  repeatCount="indefinite"
                />
              </path>
              <circle r="5" display="none" strokeWidth="4">
                <animate
                  attributeType="XML"
                  attributeName="fill"
                  dur="1s"
                  values="#ffa200;transparent;transparent;"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          </g>
          <g data-id="9hQ$s=Jh=X+u=M4oN?2G" transform="translate(20,20)">
            <path
              className="blocklyPath blocklyBlockBackground"
              stroke="#204b92"
              fill="#2b64c3"
              d={` m 0,0  m 0,4 a 4 4 0 0,1 4,-4  h ${onMlStartBlockWidth} a 4 4 0 0,1 4,4  v 4  V 8  V 43  V 47 a 4 4 0 0,1 -4,4  H 64  c -2,0  -3,1  -4,2  l -4,4  c -1,1  -2,2  -4,2  h -12  c -2,0  -3,-1  -4,-2  l -4,-4  c -1,-1  -2,-2  -4,-2  h -8 a 4 4 0 0,0 -4,4  v 54 a 4 4 0 0,0 4,4  h 8  c 2,0  3,1  4,2  l 4,4  c 1,1  2,2  4,2  h 12  c 2,0  3,-1  4,-2  l 4,-4  c 1,-1  2,-2  4,-2  H ${
                onMlStartBlockWidth + 4
              } a 4 4 0 0,1 4,4  V 121  V 141 a 4 4 0 0,1 -4,4  h -${onMlStartBlockWidth} a 4 4 0 0,1 -4,-4 z&#10;`}
            />
            <g
              data-id="bgaoB$G*o8*PP5srv4Q)"
              display="block"
              transform="translate(16,51)"
            >
              <path
                className="blocklyPath blocklyBlockBackground"
                stroke="#176cbf"
                fill="#1e90ff"
                d=" m 0,0  m 0,4 a 4 4 0 0,1 4,-4  h 8  c 2,0  3,1  4,2  l 4,4  c 1,1  2,2  4,2  h 12  c 2,0  3,-1  4,-2  l 4,-4  c 1,-1  2,-2  4,-2  h 130.4140625 a 4 4 0 0,1 4,4  v 8  V 54  V 58  V 58 a 4 4 0 0,1 -4,4  h -130.4140625  c -2,0  -3,1  -4,2  l -4,4  c -1,1  -2,2  -4,2  h -12  c -2,0  -3,-1  -4,-2  l -4,-4  c -1,-1  -2,-2  -4,-2  h -8 a 4 4 0 0,1 -4,-4 z&#10;"
              />
              <g transform="translate(8,20)">
                <text
                  className="blocklyText"
                  dominantBaseline="central"
                  x="0"
                  y="11"
                  fontSize="12pt"
                  fontWeight={600}
                  fontFamily={`"Monaco", "Menlo", "Ubuntu Mono", "Consolas", "source-code-pro", monospace`}
                  fill="white"
                >
                  {"show icon"}
                </text>
              </g>
              <g
                data-argument-type="dropdown"
                transform="translate(102.4140625,8)"
              >
                <rect
                  rx="4"
                  ry="4"
                  x="0"
                  y="0"
                  height="46"
                  width="72"
                  className="blocklyFieldRect blocklyDropdownRect"
                  stroke="#176cbf"
                  fill="transparent"
                />
                <text
                  className="blocklyText"
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
                className="blocklyText"
                dominantBaseline="central"
                x="0"
                y="11"
                fontSize="12pt"
                fontWeight={600}
                fontFamily={`"Monaco", "Menlo", "Ubuntu Mono", "Consolas", "source-code-pro", monospace`}
                fill="white"
              >
                {"on ML"}
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
                className="blocklyFieldRect blocklyDropdownRect"
                stroke="#204b92"
                fill="transparent"
              />
              <text
                className="blocklyText blocklyDropdownText"
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
              <image display="none" />
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
                className="blocklyText"
                dominantBaseline="central"
                x="0"
                y="11"
                fontSize="12pt"
                fontWeight={600}
                fontFamily={`"Monaco", "Menlo", "Ubuntu Mono", "Consolas", "source-code-pro", monospace`}
                fill="white"
              >
                start
              </text>
            </g>
          </g>
        </g>
        <g
          className="blocklyBubbleCanvas"
          transform="translate(-20, -20) scale(1)"
        />
        <defs>
          <filter id="blocklyEmbossFilter21191109718400702">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
            <feSpecularLighting
              in="blur"
              surfaceScale="1"
              specularConstant="0.5"
              specularExponent="10"
              lightingColor="white"
              result="specOut"
            >
              <fePointLight x="-5000" y="-10000" z="20000" />
            </feSpecularLighting>
            <feComposite
              in="specOut"
              in2="SourceAlpha"
              operator="in"
              result="specOut"
            />
            <feComposite
              in="SourceGraphic"
              in2="specOut"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
            />
          </filter>
          <pattern
            id="blocklyDisabledPattern21191109718400702"
            patternUnits="userSpaceOnUse"
            width="10"
            height="10"
          >
            <rect width="10" height="10" fill="#aaa" />
            <path d="M 0 0 L 10 10 M 10 0 L 0 10" stroke="#cc0" />
          </pattern>
          <filter
            id="blocklyDebugFilter21191109718400702"
            height="160%"
            width="180%"
            y="-30%"
            x="-40%"
          >
            <feComponentTransfer result="outBlur">
              <feFuncA
                type="table"
                tableValues="0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1"
              />
            </feComponentTransfer>
            <feFlood
              floodColor="#ff0000"
              floodOpacity="0.5"
              result="outColor"
            />
            <feComposite
              in="outColor"
              in2="outBlur"
              operator="in"
              result="outGlow"
            />
          </filter>
        </defs>
        <defs>
          <filter
            id="blocklySelectedGlowFilter21191109718400702"
            height="160%"
            width="180%"
            y="-30%"
            x="-40%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
            <feComponentTransfer result="outBlur">
              <feFuncA
                type="table"
                tableValues="0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1"
              />
            </feComponentTransfer>
            <feFlood floodColor="#fff200" floodOpacity="1" result="outColor" />
            <feComposite
              in="outColor"
              in2="outBlur"
              operator="in"
              result="outGlow"
            />
          </filter>
          <filter
            id="blocklyReplacementGlowFilter21191109718400702"
            height="160%"
            width="180%"
            y="-30%"
            x="-40%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            <feComponentTransfer result="outBlur">
              <feFuncA
                type="table"
                tableValues="0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1"
              />
            </feComponentTransfer>
            <feFlood floodColor="#fff200" floodOpacity="1" result="outColor" />
            <feComposite
              in="outColor"
              in2="outBlur"
              operator="in"
              result="outGlow"
            />
            <feComposite in="SourceGraphic" in2="outGlow" operator="over" />
          </filter>
        </defs>
        <defs>
          <filter
            id="blocklyHighlightGlowFilterundefined"
            height="160%"
            width="180%"
            y="-30%"
            x="-40%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.1" />
            <feComponentTransfer result="outBlur">
              <feFuncA
                type="table"
                tableValues="0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1"
              />
            </feComponentTransfer>
            <feFlood floodColor="#FFF200" floodOpacity="1" result="outColor" />
            <feComposite
              in="outColor"
              in2="outBlur"
              operator="in"
              result="outGlow"
            />
          </filter>
          <filter
            id="blocklyHighlightWarningFilterundefined"
            height="160%"
            width="180%"
            y="-30%"
            x="-40%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.1" />
            <feComponentTransfer result="outBlur">
              <feFuncA
                type="table"
                tableValues="0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1"
              />
            </feComponentTransfer>
            <feFlood floodColor="#E53D00" floodOpacity="1" result="outColor" />
            <feComposite
              in="outColor"
              in2="outBlur"
              operator="in"
              result="outGlow"
            />
          </filter>
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
      className="blocklyFieldRect blocklyDropdownRect"
      fill={led === "0" ? "#226ac8" : "white"}
    />
  ));
};

export default CodeViewDefaultBlock;
