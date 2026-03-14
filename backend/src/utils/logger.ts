// Using standard console for simple logging. In production, consider Winston or Pino.

const formatMessage = (level: string, message: string, meta?: any) => {
  const timestamp = new Date().toISOString();
  const metaString = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaString}`;
};

export const logger = {
  info: (message: string, meta?: any) => console.log(formatMessage('INFO', message, meta)),
  warn: (message: string, meta?: any) => console.warn(formatMessage('WARN', message, meta)),
  error: (message: string, meta?: any) => console.error(formatMessage('ERROR', message, meta)),
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('DEBUG', message, meta));
    }
  },
};
