const slugifyLib = require('slugify');
const { UGANDA_PHONE_REGEX } = require('../config/constants');

const paginate = (query = {}) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const sanitizePhone = (phone = '') => {
  const value = String(phone).trim().replace(/\s+/g, '');
  if (value.startsWith('+256')) {
    return `0${value.slice(4)}`;
  }
  return value;
};

const assertUgandaPhone = (phone) => {
  const value = sanitizePhone(phone);
  return UGANDA_PHONE_REGEX.test(value);
};

const calcAge = (dateOfBirth) => {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return age;
};

const buildSearchQuery = (baseQuery, keyword, columns = []) => {
  if (!keyword) {
    return { text: baseQuery, values: [] };
  }

  const whereParts = columns.map((c) => `${c} LIKE ?`);
  const likeValue = `%${keyword}%`;
  return {
    text: `${baseQuery} AND (${whereParts.join(' OR ')})`,
    values: columns.map(() => likeValue)
  };
};

const slugify = (value) => {
  return slugifyLib(value, { lower: true, strict: true, trim: true });
};

module.exports = {
  paginate,
  sanitizePhone,
  assertUgandaPhone,
  calcAge,
  buildSearchQuery,
  slugify
};
