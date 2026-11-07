import config from './config/env.js';
import app from './app.js';
import { sequelize } from './models/index.js';

const start = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        app.listen(config.port, () => {
            console.log(`Server running on http://localhost:${config.port}`);
        });


    } catch (err) {
        console.error('Unable to start the server:', err.message);
        process.exit(1);
    }
};

start();