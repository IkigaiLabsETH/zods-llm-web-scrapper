import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';
import WinstonCloudwatch from 'winston-cloudwatch';

import { env } from '@env';

type WinstonTransport =
   | winston.transports.FileTransportInstance
   | winston.transports.ConsoleTransportInstance
   | WinstonCloudwatch;

const transports: WinstonTransport[] = [
   new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
   }),
   new winston.transports.File({ filename: 'logs/combined.log' }),
   new winston.transports.File({ filename: 'logs/warn.log', level: 'warn' }),
   new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
         winston.format.colorize(),
         winston.format.printf((info: winston.Logform.TransformableInfo) => {
            return `${new Date().toISOString()}-${info.level}: ${
               info.message
            }\n`;
         })
      ),
   }),
];

if (env.IS_PRODUCTION) {
   transports.push(
      new WinstonCloudWatch({
         logGroupName: env.AWS_CLOUDWATCH_LOG_GROUP,
         logStreamName: `${new Date().toISOString().replace(/[-:]/g, '')}`,
         messageFormatter: ({ level, message, additionalInfo }) =>
            `[${level}] ${message}.${
               additionalInfo
                  ? ` Additional Info: ${JSON.stringify(additionalInfo)}`
                  : ''
            }`,
         awsOptions: {
            credentials: {
               accessKeyId: env.AWS_ACCESS_KEY_ID,
               secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            },
            region: env.AWS_REGION,
         },
      })
   );
}

const loggerInstance = winston.createLogger({
   level: 'debug',
   format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(function (info: winston.Logform.TransformableInfo) {
         return `${new Date().toISOString()}-${info.level}: ${JSON.stringify(info.message, null, 4)}\n`;
      }),
      winston.format.errors({ stack: true })
   ),
   transports,
});

export const logger = loggerInstance;
