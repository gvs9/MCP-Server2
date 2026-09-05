import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';
import http from 'http';
import url from 'url';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/documents'
];

const CREDENTIALS_PATH = 'src/client_secret_801947048828-osu4ecepnlei8ihid54k4jchtp16uqtp.apps.googleusercontent.com.json';
const TOKEN_PATH = 'tokens.json';

async function authorize() {
  const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
  const credentials = JSON.parse(content);
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  
  // Create an OAuth2 client
  // If redirect_uris is just 'http://localhost', we can try listening on an arbitrary port like 3000, 
  // as Google's desktop flow allows localhost with any port. Let's use 3000.
  const redirectUri = 'http://localhost:3000';
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirectUri);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('--- ACTION REQUIRED ---');
  console.log('Authorize this app by visiting this url:');
  console.log(authUrl);
  console.log('-----------------------');
  
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        if (req.url.indexOf('/') > -1) {
          const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
          const code = qs.get('code');
          if (code) {
            res.end('Authentication successful! Please return to the console.');
            server.destroy();
            
            console.log('Code received, generating token...');
            const { tokens } = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(tokens);
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
            console.log('Token stored to', TOKEN_PATH);
            resolve(oAuth2Client);
          } else {
             res.end('Waiting for authentication...');
          }
        }
      } catch (e) {
        reject(e);
      }
    });

    // Add destroy method to close server immediately
    const connections = new Set();
    server.on('connection', (conn) => {
      connections.add(conn);
      conn.on('close', () => connections.delete(conn));
    });
    server.destroy = () => {
      server.close();
      for (const conn of connections) {
        conn.destroy();
      }
    };

    server.listen(3000, () => {
      console.log('Listening on http://localhost:3000 for the OAuth2 callback...');
    });
  });
}

authorize().then(() => {
  console.log('Token generation complete.');
  process.exit(0);
}).catch(console.error);
