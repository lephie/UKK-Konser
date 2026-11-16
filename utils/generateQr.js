import { randomUUID } from 'crypto';

// The string stored in ticket.qr_code. It is random, so it can't be guessed or forged.
export const generateQRString = () => `TKT-${randomUUID()}`;

export default generateQRString;
