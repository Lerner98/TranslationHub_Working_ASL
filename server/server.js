const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');
const db = require('./database');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { ERROR_MESSAGES } = require('./constants');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const port = 3000;
const JWT_SECRET = process.env.SESSION_SECRET || 'K9mP2qL8j5vX4rY7n6zB3wT';
const SESSION_EXPIRATION = 24 * 60 * 60; // 24 hours in seconds

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Initialize OpenAI client (for text-to-speech, vision, and speech-to-text)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));

// Middleware to handle _method query parameter
app.use((req, res, next) => {
  if (req.method === 'POST' && req.query._method) {
    req.method = req.query._method.toUpperCase();
  }
  next();
});

/**
 * Middleware to verify JWT token for protected routes.
 * @param {Object} req - Express request object.
 * @returns {Promise<Object>} Authentication result with user or error.
 */
const authenticateToken = async (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return { error: ERROR_MESSAGES.TOKEN_REQUIRED, status: 401 };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const session = await db.validateSession(token);
    if (!session) {
      return { error: ERROR_MESSAGES.INVALID_SESSION, status: 403 };
    }
    return { user: decoded };
  } catch (err) {
    return { error: ERROR_MESSAGES.INVALID_TOKEN, status: 403 };
  }
};

/**
 * Middleware to optionally authenticate (allows guest users).
 * @param {Object} req - Express request object.
 * @returns {Promise<Object>} Authentication result with user or error.
 */
const optionalAuthenticateToken = async (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return { user: null }; // No token, proceed as guest
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const session = await db.validateSession(token);
    if (!session) {
      return { error: ERROR_MESSAGES.INVALID_SESSION, status: 403 };
    }
    return { user: decoded };
  } catch (err) {
    return { error: ERROR_MESSAGES.INVALID_TOKEN, status: 403 };
  }
};

/**
 * Search supported languages based on a query.
 * @param {string} query - The search query to filter languages.
 * @returns {Promise<Array>} The filtered list of supported languages.
 */
const searchLanguages = async (query) => {
  const supportedLanguages = [
    { code: 'af', name: 'Afrikaans' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hy', name: 'Armenian' },
    { code: 'az', name: 'Azerbaijani' },
    { code: 'be', name: 'Belarusian' },
    { code: 'bs', name: 'Bosnian' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'ca', name: 'Catalan' },
    { code: 'zh', name: 'Chinese' },
    { code: 'hr', name: 'Croatian' },
    { code: 'cs', name: 'Czech' },
    { code: 'da', name: 'Danish' },
    { code: 'nl', name: 'Dutch' },
    { code: 'en', name: 'English' },
    { code: 'et', name: 'Estonian' },
    { code: 'fi', name: 'Finnish' },
    { code: 'fr', name: 'French' },
    { code: 'gl', name: 'Galician' },
    { code: 'de', name: 'German' },
    { code: 'el', name: 'Greek' },
    { code: 'he', name: 'Hebrew' },
    { code: 'hi', name: 'Hindi' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'is', name: 'Icelandic' },
    { code: 'id', name: 'Indonesian' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'kn', name: 'Kannada' },
    { code: 'kk', name: 'Kazakh' },
    { code: 'ko', name: 'Korean' },
    { code: 'lv', name: 'Latvian' },
    { code: 'lt', name: 'Lithuanian' },
    { code: 'mk', name: 'Macedonian' },
    { code: 'ms', name: 'Malay' },
    { code: 'mr', name: 'Marathi' },
    { code: 'mi', name: 'Maori' },
    { code: 'ne', name: 'Nepali' },
    { code: 'no', name: 'Norwegian' },
    { code: 'fa', name: 'Persian' },
    { code: 'pl', name: 'Polish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ro', name: 'Romanian' },
    { code: 'ru', name: 'Russian' },
    { code: 'sr', name: 'Serbian' },
    { code: 'sk', name: 'Slovak' },
    { code: 'sl', name: 'Slovenian' },
    { code: 'es', name: 'Spanish' },
    { code: 'sw', name: 'Swahili' },
    { code: 'sv', name: 'Swedish' },
    { code: 'tl', name: 'Tagalog' },
    { code: 'ta', name: 'Tamil' },
    { code: 'th', name: 'Thai' },
    { code: 'tr', name: 'Turkish' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'ur', name: 'Urdu' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'cy', name: 'Welsh' },
  ];

  const filteredLanguages = supportedLanguages.filter((lang) =>
    lang.name.toLowerCase().includes(query.toLowerCase()) ||
    lang.code.toLowerCase().includes(query.toLowerCase())
  );
  return filteredLanguages;
};

/**
 * Register a new user.
 * @route POST /register
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.createUser(email, hashedPassword);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message || ERROR_MESSAGES.FAILED_TO_REGISTER });
  }
});

/**
 * Authenticate a user and return a JWT token.
 * @route POST /login
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED });
  }

  try {
    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_CREDENTIALS });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_CREDENTIALS });
    }

    const token = jwt.sign({ id: user.UserId, email: user.email }, JWT_SECRET, { expiresIn: SESSION_EXPIRATION });
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + SESSION_EXPIRATION * 1000); // 24 hours from now
    await db.createSession(user.UserId, sessionId, expiresAt, token);

    res.json({
      success: true,
      user: {
        id: user.UserId,
        email: user.email,
        defaultFromLang: user.default_from_lang,
        defaultToLang: user.default_to_lang,
        signed_session_id: token,
      },
      token,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || ERROR_MESSAGES.FAILED_TO_LOGIN });
  }
});

/**
 * Validate a user session.
 * @route GET /validate-session
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.get('/validate-session', async (req, res) => {
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }
  res.json({ success: true, user: authResult.user });
});

/**
 * Log out a user by invalidating their session.
 * @route POST /logout
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.post('/logout', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: ERROR_MESSAGES.TOKEN_REQUIRED });
  }

  try {
    const session = await db.validateSession(token);
    if (!session) {
      return res.json({ success: true });
    }

    await db.logout(token);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || ERROR_MESSAGES.FAILED_TO_LOGOUT });
  }
});

/**
 * Update user preferences (e.g., default languages).
 * @route POST /preferences
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.post('/preferences', async (req, res) => {
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { defaultFromLang, defaultToLang } = req.body;
  const userId = authResult.user.id;

  try {
    await db.updateUserPreferences(userId, defaultFromLang, defaultToLang);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || ERROR_MESSAGES.FAILED_TO_UPDATE_PREFERENCES });
  }
});

/**
 * Translate text using OpenAI, with optional language detection.
 * @route POST /translate
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.post('/translate', async (req, res) => {
  const authResult = await optionalAuthenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { text, targetLang, sourceLang = 'auto' } = req.body;
  if (!text || !targetLang) {
    return res.status(400).json({ error: ERROR_MESSAGES.TEXT_TARGETLANG_REQUIRED });
  }

  try {
    let detectedLang = sourceLang;

    // Step 1: Detect the language of the input text
    if (sourceLang === 'auto') {
      const detectResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a language detection expert. Detect the primary language of the following text and return only the language code (e.g., "en" for English, "he" for Hebrew). If the text contains multiple languages, focus on the most prominent language. If the text is a proper noun (e.g., a brand name like "Lenovo"), ambiguous, or empty, return "unknown" instead of guessing. Do not provide any explanations.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
      });

      detectedLang = detectResponse.choices[0].message.content.trim();

      // If the detected language is "unknown", assume a default source language (English)
      if (detectedLang === 'unknown') {
        detectedLang = 'en';
      }
    } else {
      detectedLang = sourceLang;
    }

    // Step 2: If the detected language is the same as the target language, return the original text
    if (detectedLang === targetLang) {
      return res.json({ translatedText: text, detectedLang });
    }

    // Step 3: Attempt to translate the text
    const translationResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the user's message from ${detectedLang} to ${targetLang}. If the text is a proper noun (e.g., a brand name like "Lenovo") or cannot be translated into a meaningful word in the target language, transliterate the text into the script of ${targetLang} without translating the meaning (e.g., "Lenovo" in English to "לנובו" in Hebrew). Respond only with the translated or transliterated text, without any explanation or context.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
    });

    const translatedText = translationResponse.choices[0].message.content.trim();
    res.json({ translatedText, detectedLang });
  } catch (err) {
    res.status(500).json({ error: ERROR_MESSAGES.FAILED_TO_TRANSLATE });
  }
});

/**
 * Extract text from an image using OpenAI Vision.
 * @route POST /recognize-text
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.post('/recognize-text', async (req, res) => {
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: ERROR_MESSAGES.IMAGE_DATA_REQUIRED });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Extract only the text from this image, ignoring any non-text elements such as logos, icons, or graphics. Return only the exact text found in the image, without any additional descriptions, explanations, or context. If no text is found, return an empty string (""). Do not include phrases like "The text in the image is".',
        },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
    });

    let extractedText = response.choices[0].message.content.trim();

    // Post-process to remove any unwanted descriptive text
    const match = extractedText.match(/(?:The text[^']*')(.+?)'/);
    if (match && match[1]) {
      extractedText = match[1];
    }

    res.json({ text: extractedText });
  } catch (err) {
    res.status(500).json({ error: ERROR_MESSAGES.FAILED_TO_RECOGNIZE_TEXT });
  }
});

/**
 * Convert audio to text using OpenAI Whisper API.
 * @route POST /speech-to-text
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.post('/speech-to-text', upload.single('audio'), async (req, res) => {
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { sourceLang } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: ERROR_MESSAGES.AUDIO_FILE_REQUIRED });
  }

  if (!req.file.path || !fs.existsSync(req.file.path)) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_FILE_PATH });
  }

  if (!req.file.mimetype || !req.file.mimetype.startsWith('audio/')) {
    return res.status(400).json({ error: ERROR_MESSAGES.INVALID_AUDIO_FORMAT });
  }

  try {
    const originalPath = req.file.path;
    const ext = path.extname(req.file.originalname) || '.m4a';
    const tempPath = `${originalPath}${ext}`;

    fs.renameSync(originalPath, tempPath); // Add extension to file

    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: 'whisper-1',
      language: sourceLang,
    });

    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath); // Safe deletion after use
    }

    const transcription = response.text;
    res.json({ text: transcription || '' });
  } catch (err) {
    res.status(500).json({ error: err.message || ERROR_MESSAGES.FAILED_TO_TRANSCRIBE });
  }
});

/**
 * Convert text to audio using OpenAI TTS.
 * @route POST /text-to-speech
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.post('/text-to-speech', async (req, res) => {
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { text, language } = req.body;
  if (!text || !language) {
    return res.status(400).json({ error: ERROR_MESSAGES.TEXT_LANGUAGE_REQUIRED });
  }

  try {
    const speechFilePath = path.join(__dirname, `speech-${uuidv4()}.mp3`);
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(speechFilePath, buffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename=speech.mp3');
    res.sendFile(speechFilePath, (err) => {
      if (err) {
        // Log removed
      }
      fs.unlinkSync(speechFilePath);
    });
  } catch (err) {
    res.status(500).json({ error: err.message || ERROR_MESSAGES.FAILED_TO_GENERATE_SPEECH });
  }
});

/**
 * Recognize ASL gestures from an image using OpenAI Vision.
 * @route POST /recognize-asl
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.post('/recognize-asl', async (req, res) => {
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: ERROR_MESSAGES.IMAGE_DATA_REQUIRED });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Interpret the American Sign Language (ASL) gesture in this image and provide the corresponding English word or phrase.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
    });

    const recognizedText = response.choices[0].message.content;
    res.json({ text: recognizedText });
  } catch (err) {
    res.status(500).json({ error: ERROR_MESSAGES.FAILED_TO_RECOGNIZE_ASL });
  }
});

/**
 * Extract text from a file (PDF, DOCX, TXT).
 * @route POST /extract-text
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.post('/extract-text', async (req, res) => {
  const authResult = await authenticateToken(req);
  if (authResult?.error) {
    return res.status(authResult.status).json({
      error: ERROR_MESSAGES.LOGIN_REQUIRED,
      code: 'AUTH_REQUIRED'
    });
  }

  const { uri } = req.body;
  if (!uri) {
    return res.status(400).json({ error: ERROR_MESSAGES.FILE_URI_REQUIRED });
  }

  try {
    const buffer = Buffer.from(uri, 'base64');
    const extension = detectFileExtensionFromBase64(uri);

    if (extension === 'pdf') {
      const textData = await pdfParse(buffer);
      return res.json({ text: textData.text });
    }

    if (extension === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      return res.json({ text: result.value });
    }

    if (extension === 'txt') {
      return res.json({ text: buffer.toString('utf-8') });
    }

    return res.status(400).json({ error: ERROR_MESSAGES.UNSUPPORTED_FILE_TYPE });
  } catch (err) {
    return res.status(500).json({ error: ERROR_MESSAGES.FAILED_TO_EXTRACT_TEXT });
  }
});

/**
 * Detect file type from Base64 prefix.
 * @param {string} base64String - The Base64-encoded string.
 * @returns {string} The detected file extension.
 */
function detectFileExtensionFromBase64(base64String) {
  const prefix = base64String.slice(0, 50);
  if (prefix.includes('application/pdf')) return 'pdf';
  if (prefix.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) return 'docx';
  if (prefix.includes('application/msword')) return 'docx';
  if (prefix.includes('text/plain')) return 'txt';
  if (prefix.includes('UEsDB')) return 'docx'; // DOCX files start like this (ZIP)
  if (prefix.startsWith('%PDF')) return 'pdf'; // PDF in ASCII
  return '';
}

/**
 * Generate a Word document from text.
 * @route POST /generate-docx
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.post('/generate-docx', async (req, res) => {
  const authResult = await optionalAuthenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: ERROR_MESSAGES.TEXT_REQUIRED });
  }

  try {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: text,
                  size: 24,
                }),
              ],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename=translated.docx');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message || ERROR_MESSAGES.FAILED_TO_GENERATE_DOC });
  }
});

/**
 * Save a text translation for a user.
 * @route POST /translations/text
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.post('/translations/text', async (req, res) => {
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { fromLang, toLang, original_text, translated_text, type } = req.body;
  const userId = authResult.user.id;

  try {
    await db.saveTextTranslation(userId, fromLang, toLang, original_text, translated_text, type);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || ERROR_MESSAGES.FAILED_TO_SAVE_TEXT_TRANSLATION });
  }
});

/**
 * Retrieve a user's text translations.
 * @route GET /translations/text
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.get('/translations/text', async (req, res) => {
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.id;

  try {
    const translations = await db.getTextTranslations(userId);
    res.json(translations);
  } catch (err) {
    res.status(500).json({ error: err.message || ERROR_MESSAGES.FAILED_TO_FETCH_TEXT_TRANSLATIONS });
  }
});

/**
 * Save a voice translation for a user.
 * @route POST /translations/voice
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.post('/translations/voice', async (req, res) => {
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { fromLang, toLang, original_text, translated_text, type } = req.body;
  const userId = authResult.user.id;

  try {
    await db.saveVoiceTranslation(userId, fromLang, toLang, original_text, translated_text, type);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || ERROR_MESSAGES.FAILED_TO_SAVE_VOICE_TRANSLATION });
  }
});

/**
 * Retrieve a user's voice translations.
 * @route GET /translations/voice
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.get('/translations/voice', async (req, res) => {
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.id;

  try {
    const translations = await db.getVoiceTranslations(userId);
    res.json(translations);
  } catch (err) {
    res.status(500).json({ error: err.message || ERROR_MESSAGES.FAILED_TO_FETCH_VOICE_TRANSLATIONS });
  }
});

/**
 * Delete a specific translation for a user.
 * @route DELETE /translations/delete/:id
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.delete('/translations/delete/:id', async (req, res) => {
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.id;
  const { id } = req.params;

  try {
    await db.deleteTranslation(userId, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || ERROR_MESSAGES.FAILED_TO_DELETE_TRANSLATION });
  }
});

/**
 * Delete a specific translation for a user (alternative POST endpoint).
 * @route POST /translations/delete/:id
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.post('/translations/delete/:id', async (req, res) => {
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.id;
  const { id } = req.params;

  try {
    await db.deleteTranslation(userId, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || ERROR_MESSAGES.FAILED_TO_DELETE_TRANSLATION });
  }
});

/**
 * Clear all translations (text and voice) for a user.
 * @route DELETE /translations
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.delete('/translations', async (req, res) => {
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.id;

  try {
    await db.clearTranslations(userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || ERROR_MESSAGES.FAILED_TO_CLEAR_TRANSLATIONS });
  }
});

/**
 * Retrieve language statistics for a user.
 * @route GET /statistics
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.get('/statistics', async (req, res) => {
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.id;

  try {
    const stats = await db.getLanguageStatistics(userId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message || ERROR_MESSAGES.FAILED_TO_FETCH_STATISTICS });
  }
});

/**
 * Retrieve audit logs for a user.
 * @route GET /audit-logs
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.get('/audit-logs', async (req, res) => {
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.id;

  try {
    const logs = await db.getAuditLogs(userId);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message || ERROR_MESSAGES.FAILED_TO_FETCH_AUDIT_LOGS });
  }
});

/**
 * Search supported languages by query.
 * @route GET /languages
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void}
 */
app.get('/languages', async (req, res) => {
  const { query } = req.query;
  if (query === undefined) {
    return res.status(400).json({ error: ERROR_MESSAGES.QUERY_PARAM_REQUIRED });
  }

  try {
    const result = await searchLanguages(query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || ERROR_MESSAGES.FAILED_TO_SEARCH_LANGUAGES });
  }
});

app.listen(port, () => {});