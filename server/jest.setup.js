require('dotenv').config();

module.exports = {
    preset: '@shelf/jest-mongodb',
};

console.log('jest.setup.js: MongoDB URI:', process.env.MONGO_URI);
