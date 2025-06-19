// database.js
const sql = require('mssql');
const path = require('path');
const dotenv = require('dotenv');

// Construct the absolute path to the .env file (one level up from backend)
const envPath = path.resolve(__dirname, '.env');
console.log('Attempting to load .env file from:', envPath);

// Load .env file
dotenv.config({ path: envPath });

console.log('Loaded environment variables:', {
  DB_SERVER: process.env.DB_SERVER,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  SESSION_SECRET: process.env.SESSION_SECRET,
  SESSION_EXPIRATION: process.env.SESSION_EXPIRATION,
});

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool;

const connectToDb = async () => {
  try {
    pool = await sql.connect(config);
    console.log('Connected to MSSQL database');
  } catch (err) {
    console.error('Error connecting to MSSQL database:', err);
    throw err;
  }
};

connectToDb();

const dbOperations = {
  createUser: async (email, password) => {
    try {
      const request = pool.request();
      const result = await request
        .input('Email', sql.NVarChar, email)
        .input('PasswordHash', sql.NVarChar, password)
        .execute('spRegisterUser');
      return result.recordset[0].Message === 'Registration successful';
    } catch (err) {
      throw new Error(err.message || 'Failed to register user');
    }
  },

  findUserByEmail: async (email) => {
    try {
      const request = pool.request();
      const result = await request
        .input('Email', sql.NVarChar, email)
        .execute('spLoginUser');
      return result.recordset[0];
    } catch (err) {
      throw new Error(err.message || 'Invalid email or password');
    }
  },

  createSession: async (userId, sessionId, expiresAt, signedSessionId) => {
    try {
      const request = pool.request();
      await request
        .input('UserId', sql.UniqueIdentifier, userId)
        .input('SessionId', sql.UniqueIdentifier, sessionId)
        .input('ExpiresAt', sql.DateTime, expiresAt)
        .input('SignedSessionId', sql.NVarChar, signedSessionId)
        .execute('spCreateSession');
    } catch (err) {
      throw new Error(err.message || 'Failed to create session');
    }
  },

  validateSession: async (signedSessionId) => {
    try {
      const request = pool.request();
      const result = await request
        .input('SignedSessionId', sql.NVarChar, signedSessionId)
        .execute('spValidateSession');
      return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (err) {
      throw new Error(err.message || 'Invalid session');
    }
  },

  logout: async (signedSessionId) => {
    try {
      const request = pool.request();
      await request
        .input('SignedSessionId', sql.NVarChar, signedSessionId)
        .execute('spLogoutUser');
    } catch (err) {
      throw new Error(err.message || 'Failed to logout');
    }
  },

  updateUserPreferences: async (userId, defaultFromLang, defaultToLang) => {
    try {
      const request = pool.request();
      await request
        .input('UserId', sql.UniqueIdentifier, userId)
        .input('DefaultFromLang', sql.NVarChar, defaultFromLang)
        .input('DefaultToLang', sql.NVarChar, defaultToLang)
        .execute('spUpdateUserPreferences');
    } catch (err) {
      throw new Error(err.message || 'Failed to update preferences');
    }
  },

  saveTextTranslation: async (userId, fromLang, toLang, original, translated, type) => {
    try {
      const request = pool.request();
      await request
        .input('UserId', sql.UniqueIdentifier, userId)
        .input('FromLang', sql.NVarChar, fromLang)
        .input('ToLang', sql.NVarChar, toLang)
        .input('OriginalText', sql.NVarChar(sql.MAX), original)
        .input('TranslatedText', sql.NVarChar(sql.MAX), translated)
        .input('Type', sql.NVarChar, type || 'text')
        .execute('spSaveTextTranslation');
    } catch (err) {
      throw new Error(err.message || 'Failed to save text translation');
    }
  },

  getTextTranslations: async (userId) => {
    try {
      const request = pool.request();
      const result = await request
        .input('UserId', sql.UniqueIdentifier, userId)
        .execute('spGetUserTextTranslations');
      return result.recordset;
    } catch (err) {
      throw new Error(err.message || 'Failed to fetch text translations');
    }
  },

  saveVoiceTranslation: async (userId, fromLang, toLang, original, translated, type) => {
    try {
      const request = pool.request();
      await request
        .input('UserId', sql.UniqueIdentifier, userId)
        .input('FromLang', sql.NVarChar, fromLang)
        .input('ToLang', sql.NVarChar, toLang)
        .input('OriginalText', sql.NVarChar(sql.MAX), original)
        .input('TranslatedText', sql.NVarChar(sql.MAX), translated)
        .input('Type', sql.NVarChar, type || 'voice')
        .execute('spSaveVoiceTranslation');
    } catch (err) {
      throw new Error(err.message || 'Failed to save voice translation');
    }
  },

  getVoiceTranslations: async (userId) => {
    try {
      const request = pool.request();
      const result = await request
        .input('UserId', sql.UniqueIdentifier, userId)
        .execute('spGetUserVoiceTranslations');
      return result.recordset;
    } catch (err) {
      throw new Error(err.message || 'Failed to fetch voice translations');
    }
  },

  clearTranslations: async (userId) => {
    try {
      const request = pool.request();
      await request
        .input('UserId', sql.UniqueIdentifier, userId)
        .execute('spClearTranslations');
    } catch (err) {
      throw new Error(err.message || 'Failed to clear translations');
    }
  },

  deleteTranslation: async (userId, id) => {
    console.log('deleteTranslation called with userId:', userId, 'translationId:', id);
    try {
      const request = pool.request();
      await request
        .input('UserId', sql.UniqueIdentifier, userId)
        .input('TranslationId', sql.UniqueIdentifier, id)
        .execute('spDeleteTranslation');
      console.log('Successfully executed spDeleteTranslation for translationId:', id);
    } catch (err) {
      console.error('Error executing spDeleteTranslation:', err);
      throw new Error(err.message || 'Failed to delete translation');
    }
  },

  updateLanguageStatistics: async (userId, fromLang, toLang) => {
    try {
      const request = pool.request();
      await request
        .input('UserId', sql.UniqueIdentifier, userId)
        .input('FromLang', sql.NVarChar, fromLang)
        .input('ToLang', sql.NVarChar, toLang)
        .execute('spUpdateLanguageStatistics');
    } catch (err) {
      throw new Error(err.message || 'Failed to update language statistics');
    }
  },

  getLanguageStatistics: async (userId) => {
    try {
      const request = pool.request();
      const result = await request
        .input('UserId', sql.UniqueIdentifier, userId)
        .execute('spGetLanguageStatistics');
      return result.recordset;
    } catch (err) {
      throw new Error(err.message || 'Failed to fetch language statistics');
    }
  },

  getAuditLogs: async (userId) => {
    try {
      const request = pool.request();
      const result = await request
        .input('UserId', sql.UniqueIdentifier, userId)
        .execute('spGetAuditLogs');
      return result.recordset;
    } catch (err) {
      throw new Error(err.message || 'Failed to fetch audit logs');
    }
  },
};

module.exports = dbOperations;