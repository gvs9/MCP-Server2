import { google } from 'googleapis';
import * as dotenv from 'dotenv';

dotenv.config();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables for Google OAuth
let CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
let CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
let REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';
let REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
let TOKENS: any = null;

// Try loading from base64 environment variables first (for Railway)
if (process.env.GOOGLE_CLIENT_SECRET_BASE64) {
  try {
    const content = Buffer.from(process.env.GOOGLE_CLIENT_SECRET_BASE64, 'base64').toString('utf8');
    const credentials = JSON.parse(content);
    const key = credentials.installed || credentials.web;
    if (!key) {
        throw new Error("Invalid client secret JSON: missing 'installed' or 'web' key");
    }
    CLIENT_ID = key.client_id;
    CLIENT_SECRET = key.client_secret;
    REDIRECT_URI = key.redirect_uris[0];
  } catch (e: any) {
    console.error("Failed to parse GOOGLE_CLIENT_SECRET_BASE64:", e.message);
  }
} else {
  // Fall back to client secret file
  const CREDENTIALS_PATH = path.join(__dirname, '..', 'client_secret_801947048828-osu4ecepnlei8ihid54k4jchtp16uqtp.apps.googleusercontent.com.json');
  try {
    if (fs.existsSync(CREDENTIALS_PATH)) {
      const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
      const credentials = JSON.parse(content);
      const key = credentials.installed || credentials.web;
      if (key) {
        CLIENT_ID = key.client_id;
        CLIENT_SECRET = key.client_secret;
        REDIRECT_URI = key.redirect_uris[0];
      }
    }
  } catch (e: any) {
    console.error("Could not read client_secret JSON, falling back to .env:", e.message);
  }
}

if (process.env.GOOGLE_TOKENS_BASE64) {
  try {
    const content = Buffer.from(process.env.GOOGLE_TOKENS_BASE64, 'base64').toString('utf8');
    TOKENS = JSON.parse(content);
    if (TOKENS.refresh_token) {
      REFRESH_TOKEN = TOKENS.refresh_token;
    }
  } catch (e) {
    console.warn("Failed to parse GOOGLE_TOKENS_BASE64");
  }
} else {
  const TOKEN_PATH = path.join(__dirname, '..', '..', 'tokens.json');
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const content = fs.readFileSync(TOKEN_PATH, 'utf8');
      TOKENS = JSON.parse(content);
      if (TOKENS.refresh_token) {
        REFRESH_TOKEN = TOKENS.refresh_token;
      }
    }
  } catch (e) {
    console.warn("Could not read tokens.json, falling back to .env");
  }
}

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing required environment variables or credentials file for Google OAuth.");
}

export const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

if (TOKENS) {
  oauth2Client.setCredentials(TOKENS);
} else if (REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN
  });
}

// Initialize API clients
export const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
export const docs = google.docs({ version: 'v1', auth: oauth2Client });
