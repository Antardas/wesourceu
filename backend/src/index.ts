import express from 'express';
import cors from 'cors';
import multer from 'multer';

import { env } from './config/env';
import { documentsRouter } from './routes/documents';

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/documents', upload.single('file'), documentsRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
});

app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
});
