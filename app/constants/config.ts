import Constants from 'expo-constants';

// Prefer value from app config extras (app.config.js) -> Constants.expoConfig.extra
// Fallback to environment variables when running in other environments.
const extras: any = (Constants.expoConfig && (Constants.expoConfig.extra || {})) || (Constants.manifest && Constants.manifest.extra) || {};
export const OMDB_API_KEY = extras.OMDB_API_KEY || process.env.OMDB_API_KEY || '';
export const OMDB_BASE = 'https://www.omdbapi.com/';
export const TRAKT_CLIENT_ID = extras.TRAKT_CLIENT_ID || process.env.TRAKT_CLIENT_ID || '';
export const TRAKT_BASE = 'https://api.trakt.tv';
