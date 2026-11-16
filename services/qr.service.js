import QRCode from 'qrcode';

// Turns the qr_code string into a PNG data URL ("data:image/png;base64,...") the frontend can put in an <img>
export const qrToDataURL = (text) => QRCode.toDataURL(text, { margin: 1, width: 300 });

export default { qrToDataURL };
