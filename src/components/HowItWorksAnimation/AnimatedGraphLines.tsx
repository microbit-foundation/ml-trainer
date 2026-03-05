import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { useGraphColors } from "../../hooks/use-graph-colors";
import { useSettings } from "../../store";
import { delayInSec } from "../../utils/delay";

// ── Smooth mode: gentle rolling waves (177×28 viewBox) ────────────────────
const smoothWavePaths = {
  x: "M-80 14.5569C-68.1099 11.0349 -57.3203 12.0527 -45.8617 14.5712C-34.4031 17.0896 -31.1231 17.9446 -19.4056 14.6424C-7.68809 11.3403 4.18047 10.9331 16.1785 14.563C28.1766 18.1929 34.3914 17.1421 45.4399 14.4958C56.4885 11.8496 68.9181 10.8313 87.2604 14.4958C105.603 18.1603 110.998 17.2441 121.787 14.4958C132.577 11.7475 145.524 11.5441 160.63 14.4958C175.735 17.4475 179.54 17.0406 195.156 14.4958C210.773 11.9511 224.288 11.4991 238.315 14.4958C252.341 17.4925 254.499 18.1602 272.842 14.4958C291.184 10.8313 304.131 11.6907 316 14.4958",
  y: "M-66 7.55691C-54.1099 4.03485 -43.3203 5.05272 -31.8617 7.57117C-20.4031 10.0896 -17.1231 10.9446 -5.40559 7.64242C6.31191 4.34027 18.1805 3.9331 30.1785 7.56302C42.1766 11.1929 48.3914 10.1421 59.4399 7.49584C70.4885 4.84959 82.9181 3.8313 101.26 7.49581C119.603 11.1603 124.998 10.2441 135.787 7.49581C146.577 4.74748 159.524 4.54408 174.63 7.49581C189.735 10.4475 193.54 10.0406 209.156 7.49584C224.773 4.95108 238.288 4.49905 252.315 7.4958C266.341 10.4925 268.499 11.1602 286.842 7.4958C305.184 3.83135 318.131 4.69071 330 7.4958",
  z: "M-74 21.5569C-62.1099 18.0348 -51.3203 19.0527 -39.8617 21.5712C-28.4031 24.0896 -25.1231 24.9446 -13.4056 21.6424C-1.68809 18.3403 10.1805 17.9331 22.1785 21.563C34.1766 25.193 40.3914 24.1421 51.4399 21.4958C62.4885 18.8496 74.9181 17.8313 93.2604 21.4958C111.603 25.1603 116.998 24.2441 127.787 21.4958C138.577 18.7475 151.524 18.5441 166.63 21.4958C181.735 24.4475 185.54 24.0406 201.156 21.4958C216.773 18.9511 230.288 18.4991 244.315 21.4958C258.341 24.4926 260.499 25.1603 278.842 21.4958C297.184 17.8313 310.131 18.6907 322 21.4958",
};
const smoothViewBox = "0 0 177 28";
const smoothTileWidth = 177;
const smoothHeight = 28;

// ── Jerky mode: spiky waves (188×35 viewBox) ──────────────────────────────
const jerkyWavePaths = {
  x: "M-0.00999451 13.1992C5.5 30.5002 10.5 25.5002 15.81 13.1292C21.12 0.758083 22.64 -3.44162 28.07 12.7792C33.5 28.9999 39 31 44.56 13.1692C50.12 -4.66172 53 0.500238 58.12 13.4992C63.24 26.4981 69 31.5001 77.5 13.4993C86 -4.50144 88.5 -0.00094986 93.5 13.4993C98.5 26.9996 104.5 27.9988 111.5 13.4993C118.5 -1.00012 120.263 0.998806 127.5 13.4992C134.737 25.9995 141 28.22 147.5 13.4994C154 -1.22122 155 -4.50111 163.5 13.4994C172 31.4999 178 27.2785 183.5 13.4994",
  y: "M-5.00999 14.8008C0.5 -2.50024 5.5 2.49976 10.81 14.8708C16.12 27.2419 17.64 31.4416 23.07 15.2208C28.5 -0.999944 34 -3.00004 39.56 14.8308C45.12 32.6617 48 27.4998 53.12 14.5008C58.24 1.50192 64 -3.50013 72.5 14.5007C81 32.5014 83.5 28.0009 88.5 14.5007C93.5 1.00036 99.5 0.00118923 106.5 14.5007C113.5 29.0001 115.263 27.0012 122.5 14.5008C129.737 2.00049 136 -0.219984 142.5 14.5006C149 29.2212 150 32.5011 158.5 14.5006C167 -3.49988 173 0.721456 178.5 14.5006",
  z: "M-2 14.6024C3.52471 8.26273 8.53806 10.0949 13.8622 14.6281C19.1864 19.1613 20.7105 20.7002 26.155 14.7563C31.5995 8.81249 37.1142 8.07959 42.689 14.6134C48.2639 21.1473 51.1515 19.2558 56.2852 14.4925C61.4189 9.72926 67.1943 7.89634 75.717 14.4924C84.2397 21.0886 86.7463 19.4394 91.7597 14.4924C96.773 9.54547 102.789 9.17934 109.808 14.4924C116.826 19.8056 118.594 19.0731 125.85 14.4925C133.107 9.91195 139.387 9.0983 145.904 14.4924C152.421 19.8866 153.424 21.0884 161.947 14.4924C170.469 7.89643 176.485 9.44327 182 14.4924",
};
const jerkyViewBox = "0 0 188 35";
const jerkyTileWidth = 188;
const jerkyHeight = 35;

const visibleWindowWidth = 100; //px
const animationDuration = 3; //sec

type MotionType = "smooth" | "jerky";

export interface AnimatedGraphLinesRef {
  show(motion: MotionType): Promise<void>;
  reset(): void;
}

const AnimatedGraphLines = forwardRef<AnimatedGraphLinesRef>(
  function AnimatedGraphLines(_, ref) {
    const [{ graphColorScheme }] = useSettings();
    const [visible, setVisible] = useState<boolean>(false);
    const colors = useGraphColors(graphColorScheme);
    const [motion, setMotion] = useState<MotionType>("jerky");

    const waves = useMemo(
      () => [
        { color: colors.x, delay: "0s", pathKey: "x" as const },
        { color: colors.y, delay: "-1s", pathKey: "y" as const },
        { color: colors.z, delay: "-2s", pathKey: "z" as const },
      ],
      [colors.x, colors.y, colors.z]
    );

    useImperativeHandle(
      ref,
      () => ({
        async show(motionType) {
          setVisible(true);
          if (motionType) {
            setMotion(motionType);
          }
          await delayInSec(animationDuration);
        },
        reset() {
          setVisible(false);
        },
      }),
      []
    );

    const isSmooth = motion === "smooth";
    const paths = isSmooth ? smoothWavePaths : jerkyWavePaths;
    const viewBox = isSmooth ? smoothViewBox : jerkyViewBox;
    const tileWidth = isSmooth ? smoothTileWidth : jerkyTileWidth;
    const height = isSmooth ? smoothHeight : jerkyHeight;

    return (
      <div
        style={{
          opacity: visible ? 1 : 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <style>{`
            @keyframes waveScroll {
              from { transform: translateX(${
                -tileWidth + visibleWindowWidth
              }px); }
              to   { transform: translateX(0); }
            }
          `}</style>

          {/* Both modes: all 3 paths share one scrolling SVG */}
          <div
            style={{
              width: `${visibleWindowWidth}px`,
              height: `${height}px`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                animation: `waveScroll ${animationDuration}s linear infinite`,
              }}
            >
              {[0, 1].map((copy) => (
                <svg
                  key={copy}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox={viewBox}
                  width={`${tileWidth}px`}
                  height={`${height}px`}
                  style={{ display: "block", flexShrink: 0 }}
                  preserveAspectRatio="none"
                >
                  {waves.map((wave) => (
                    <path
                      key={wave.pathKey}
                      d={paths[wave.pathKey]}
                      fill="none"
                      stroke={wave.color}
                      strokeOpacity={1}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  ))}
                </svg>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default AnimatedGraphLines;
