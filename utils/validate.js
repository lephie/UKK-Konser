const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //konon katanya ini standar regex email

export const isEmail = (value) => typeof value === 'string' && EMAIL_REGEX.test(value.trim());

// ngecek body apakah ada yang '' ilang atau phone = 'phone'

export const missingFields = (body, fields) =>
    fields.filter((f) => body[f] === undefined || body[f] === null || String(body[f]).trim() === '');

export const toPositiveInt = (value) =>{
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null
}

export const dateValidate = (value) =>{
    if(value == undefined || value == null || value == '' ) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
}

export const parseMapUrl = (value) => {
    if (value === undefined || value === null || String(value).trim() === '') return { value: null };
    let raw = String(value).trim();
    const iframe = raw.match(/src=["']([^"']+)["']/i);
    if (iframe) raw = iframe[1];
    try {
        const u = new URL(raw);
        const hostOk = ['www.google.com', 'google.com', 'maps.google.com'].includes(u.hostname);
        if (u.protocol !== 'https:' || !hostOk || !u.pathname.startsWith('/maps')) {
            return { problem: 'map_url must be a Google Maps embed link' };
        }
        if (u.pathname !== '/maps/embed') {
            return { problem: 'Use the embed link: Google Maps > Share > Embed a map > copy the src' };
        }
        if (u.toString().length > 1000) return { problem: 'map_url is too long (max 1000 chars)' };
        return { value: u.toString() };
    } catch {
        return { problem: 'map_url is not a valid URL' };
    }
};