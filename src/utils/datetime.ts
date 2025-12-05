import { IntlShape } from "react-intl";

const units: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
  { unit: "year", seconds: 31536000 },
  { unit: "month", seconds: 2592000 },
  { unit: "day", seconds: 86400 },
  { unit: "hour", seconds: 3600 },
  { unit: "minute", seconds: 60 },
  { unit: "second", seconds: 1 },
];

export const timeAgo = (intl: IntlShape, timestamp: number) => {
  const diffInSeconds = (timestamp - Date.now()) / 1000;
  for (const { unit, seconds } of units) {
    const interval = Math.round(diffInSeconds / seconds);
    if (Math.abs(interval) >= 1) {
      if (unit === "second") {
        return intl.formatMessage({ id: "timestamp-seconds" });
      }
      return intl.formatRelativeTime(interval, unit);
    }
  }
  return intl.formatMessage({ id: "timestamp-now" });
};
