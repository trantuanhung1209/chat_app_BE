import winston from 'winston';

// Logger sử dụng Winston với format JSON chuẩn
const isDev = process.env.NODE_ENV !== 'production';

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      const {
        request_id,
        user_id,
        route,
        status_code,
        latency_ms,
        provider,
        error,
        ...rest
      } = meta;
      const logObj = {
        level,
        msg: message,
        route,
        status_code,
        request_id,
        user_id,
        latency_ms,
        provider,
        error,
        timestamp,
        ...rest
      };
      Object.keys(logObj).forEach(key => logObj[key] === undefined && delete logObj[key]);
      // Pretty print nếu là dev, 1 dòng nếu production
      return isDev ? JSON.stringify(logObj, null, 2) : JSON.stringify(logObj);
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

export default logger;
