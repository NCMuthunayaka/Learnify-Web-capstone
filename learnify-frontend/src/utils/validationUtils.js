export const isEmail = (value) => /\S+@\S+\.\S+/.test(value);

export const required = (value) => String(value || '').trim().length > 0;

export const passwordIsValid = (value) => String(value || '').length >= 6;
