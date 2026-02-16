/**
 * Centralized Validation Utilities
 * Targets: Security, Type safety, Range checks, and Sanitization.
 */

const sanitizeInput = (val) => {
    if (typeof val !== 'string') return val;
    // Remove null bytes, newlines, and path traversal attempts globally
    return val
        .replace(/\0/g, '') // Null bytes
        .replace(/[\r\n]/g, ' ') // Newlines to spaces
        .replace(/\.\.\/|\.\.\\/g, ''); // Path traversal
};

const validateCedula = (cedula) => {
    const cedulaRegex = /^\d{3}-?\d{7}-?\d{1}$/;
    return cedulaRegex.test(cedula);
};

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 100;
};

const validateDateRange = (dateStr, minYear = 1900, maxYear = new Date().getFullYear()) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    const year = date.getFullYear();
    return year >= minYear && year <= maxYear;
};

const validateLength = (val, min, max) => {
    if (typeof val !== 'string') return false;
    return val.length >= min && val.length <= max;
};

const validatePhone = (phone) => {
    // Dominican format: 809, 829, 849 followed by 7 digits. 
    // Allowing flexible formatting like hyphens or dots.
    const phoneRegex = /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/;
    // A simpler one for just digits and basic length (DR specific 10 digits)
    const simplePhoneRegex = /^\d{10}$/;

    // Clean phone (remove non-digits)
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
};

const validateVaccinationDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;

    const today = new Date();
    today.setHours(23, 59, 59, 999); // Allow up to end of today

    // Not in the future, and not before common vaccination storage (e.g. 1900)
    return date <= today && date.getFullYear() >= 1900;
};

module.exports = {
    sanitizeInput,
    validateCedula,
    validateEmail,
    validateDateRange,
    validateLength,
    validatePhone,
    validateVaccinationDate
};
