import express from 'express';
import cors from 'cors';
import routes from './routes/index.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api', routes)


app.use((req, res) => error(res, 'Route not found', 404));


export default app;