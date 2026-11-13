import 'dotenv/config';

const config = {
    port: Number(process.env.PORT) || 5000,
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    },
    midtrans: {
        serverKey: process.env.MIDTRANS_SERVER_KEY,
        clientKey: process.env.MIDTRANS_CLIENT_KEY,
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true'
    },
    order: {
        expiryMinutes: Number(process.env.ORDER_EXPIRY_MINUTES) || 15,
        maxTicketsPerOrder: Number(process.env.MAX_TICKETS_PER_ORDER) || 4,
        maxPendingOrders: Number(process.env.MAX_PENDING_ORDERS) || 3
    }
};

if (!config.jwt.secret) {
    throw new Error('JWT_SECRET is missing in your .env file');
}

export default config;
