import cors from 'cors';
import express from 'express';

import { env } from '@env';
import { initExitHandler } from '@lib/server/exitHandler';
import { logger } from '@logger';
import { extendedTimeout } from '@middlewares';

import { llmRouter } from './routes/llm.routes';

logger.info('Starting server...');
initExitHandler();

// await checkAndRunMigrations();

const port = env.PORT || 5007;

const app = express();

// Disable the X-Powered-By header
app.disable('x-powered-by');

const allowedOriginsString = env.ALLOWED_ORIGINS || '*';
if (!allowedOriginsString) {
   throw new Error('ALLOWED_ORIGINS is not defined');
}

const allowedOrigins = allowedOriginsString.split(',');
const corsOptions = {
   origin: allowedOrigins,
   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
   allowedHeaders:
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
   credentials: true,
   optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
   res.send('ZODs LLM Web Scrapper is up.');
});

app.use('/llm', extendedTimeout, llmRouter);

app.listen(port, () => {
   console.log(`Server is running on port ${port}`);
});

// MetricsServer.getInstance();

export default app;
