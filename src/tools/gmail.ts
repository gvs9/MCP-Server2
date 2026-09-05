import { gmail } from '../auth/google.js';

export async function sendEmail(args: any) {
  const { to, subject, body, cc, bcc, bodyHtml, draft } = args;

  // Construct raw email message
  const toArray = Array.isArray(to) ? to : [to];
  const toStr = toArray.join(', ');
  
  let emailLines = [
    `To: ${toStr}`,
    `Subject: ${subject}`
  ];

  if (cc) {
    const ccArray = Array.isArray(cc) ? cc : [cc];
    emailLines.push(`Cc: ${ccArray.join(', ')}`);
  }

  if (bcc) {
    const bccArray = Array.isArray(bcc) ? bcc : [bcc];
    emailLines.push(`Bcc: ${bccArray.join(', ')}`);
  }

  // Handle HTML vs Plain Text
  if (bodyHtml) {
    emailLines.push('Content-Type: text/html; charset="UTF-8"');
    emailLines.push('');
    emailLines.push(bodyHtml);
  } else {
    emailLines.push('Content-Type: text/plain; charset="UTF-8"');
    emailLines.push('');
    emailLines.push(body);
  }

  const raw = Buffer.from(emailLines.join('\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    if (draft) {
      const response = await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: { raw }
        }
      });
      return {
        success: true,
        messageId: response.data.message?.id,
        threadId: response.data.message?.threadId,
        timestamp: new Date().toISOString()
      };
    } else {
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw }
      });
      return {
        success: true,
        messageId: response.data.id,
        threadId: response.data.threadId,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
}
