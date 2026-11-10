const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //konon katanya ini standar regex email

export const isEmail = (value) => typeof value === 'string' && EMAIL_REGEX.test(value.trim());

// ngecek body apakah ada yang '' ilang atau phone = 'phone'

export const missingFields = (body, fields) =>
    fields.filter((f) => body[f] === undefined || body[f] === null || String(body[f]).trim() === '');

export const dateValidate = (value) =>{
    if(value == undefined || value == null || value == '' ) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
}