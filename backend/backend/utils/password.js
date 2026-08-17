const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

function hash(plainText) {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

function compare(plainText, hashed) {
  return bcrypt.compare(plainText, hashed);
}

module.exports = { hash, compare };
