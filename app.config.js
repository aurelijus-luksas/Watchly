const fs = require('fs');
const dotenv = require('dotenv');

// load .env if present
if (fs.existsSync('.env')) {
  const result = dotenv.config();
  if (result.error) console.warn('Failed to load .env:', result.error);
}

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      OMDB_API_KEY: process.env.OMDB_API_KEY || '',
    },
  };
};
