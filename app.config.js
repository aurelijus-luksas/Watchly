const fs = require('fs');
const dotenv = require('dotenv');

// load .env if present
if (fs.existsSync('.env')) {
  const result = dotenv.config();
  if (result.error) console.warn('Failed to load .env:', result.error);
}

module.exports = ({ config }) => ({
  ...config,
  name: 'Watchly',
  slug: 'Movie-Rate',
  owner: 'aurelijusluksas',
  android: {
    package: 'com.aurelijusluksas.watchly',
  },
  extra: {
    ...(config.extra || {}),
    OMDB_API_KEY: process.env.OMDB_API_KEY || '',
    TRAKT_CLIENT_ID: process.env.TRAKT_CLIENT_ID || '',
  },
});