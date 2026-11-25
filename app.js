import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { error } from './utils/response.js';
import { UPLOAD_ROOT } from './middleware/upload.js';

const app = express()

app.use(cors())
app.use(express.json())
app.use((req, res, next) => {
    next();
});

app.get('/health', (req, res) => res.json({status: 'ok'}))

app.use('/uploads', express.static(UPLOAD_ROOT));

app.use('/api', routes)


app.use((req, res) => error(res, 'Route not found', 404));

app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return error(res, 'Invalid JSON body', 400);
    console.error(err);
    return error(res, err.message || 'Internal server error', err.status || 500);
});

export default app;