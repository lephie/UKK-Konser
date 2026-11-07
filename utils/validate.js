const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //konon katanya ini standar regex email

export const isEmail = (value) => typeof value === 'string' && EMAIL_REGEX.test(value.trim());

// idk what is this tbh
export const missingFields = (body, fields) =>
    fields.filter((f) => body[f] === undefined || body[f] === null || String(body[f]).trim() === '');
