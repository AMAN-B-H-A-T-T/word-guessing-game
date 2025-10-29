import { transports, createLogger, format, Logger } from "winston";
import { Format, TransformableInfo, FormatWrap } from "logform";

let rid: string;
const { printf } = format;

const levels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  http: 5,
};

const rTracerFormat: Format = printf((info: TransformableInfo): string => {
  try {
    const parsedInfo = JSON.parse(info.message as string);
    return JSON.stringify({
      level: info.level,
      "speed-request": rid,
      ...parsedInfo,
      timestamp: new Date(),
    });
  } catch (error) {
    return JSON.stringify({
      level: info.level,
      "speed-request": rid,
      message: info.message,
      timestamp: new Date(),
      ...info,
    });
  }
});

const levelUpperCaseFormatter: FormatWrap = format(
  (info: TransformableInfo) => {
    info.level = info.level.toUpperCase();
    return info;
  }
);

const logger: Logger = createLogger({
  levels,
  transports: [
    new transports.Console({
      format: format.combine(
        levelUpperCaseFormatter(),
        format.json(),
        rTracerFormat
      ),
      level: "http",
    }),
  ],
});

export const initializeTracer = (rTracerId: string) => {
  rid = rTracerId;
};

export default logger;
