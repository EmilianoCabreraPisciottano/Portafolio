const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const port = Number(process.env.PORT) || 3000;

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const nodemailer = require('nodemailer');

async function handleContact(req, res) {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString();
    let data = {};
    try {
      data = JSON.parse(raw);
    } catch (e) {
      // try urlencoded
      data = Object.fromEntries(new URLSearchParams(raw));
    }

    const name = (data.name || '').trim();
    const email = (data.email || '').trim();
    const message = (data.message || '').trim();

    if (!name || !email || !message) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Missing fields' }));
      return;
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT) || 465;
    const smtpSecure = (process.env.SMTP_SECURE || 'true') === 'true';
    const fromEmail = process.env.FROM_EMAIL || smtpUser;
    const toEmail = process.env.TO_EMAIL || 'emilianocabrerapisciottano@gmail.com';

    if (!smtpUser || !smtpPass) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Email not configured on server' }));
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass }
    });

    const mail = {
      from: `${name} <${fromEmail}>`,
      to: toEmail,
      subject: `Nuevo mensaje desde portafolio: ${name}`,
      text: `Nombre: ${name}\nEmail: ${email}\n\n${message}`,
      html: `<p><strong>Nombre:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p>${message.replace(/\n/g, '<br>')}</p>`
    };

    await transporter.sendMail(mail);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error('Contact send error', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Send failed' }));
  }
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let requestPath = decodeURIComponent(requestUrl.pathname);

  if (req.method === 'POST' && requestPath === '/contact') {
    handleContact(req, res);
    return;
  }

  if (requestPath === '/') {
    requestPath = '/index.html';
  }

  const safePath = path.normalize(requestPath).replace(/^([.]{2}[\/])+/, '');
  const filePath = path.join(rootDir, safePath);

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, fileContent) => {
    if (error) {
      const notFoundPath = path.join(rootDir, 'index.html');
      fs.readFile(notFoundPath, (fallbackError, fallbackContent) => {
        if (fallbackError) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Server error');
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fallbackContent);
      });
      return;
    }

    const contentType = contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fileContent);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Portfolio server running on port ${port}`);
});