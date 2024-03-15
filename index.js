import express from 'express';
import { createBareServer } from '@tomphttp/bare-server-node';
import { fileURLToPath } from 'url';
import { createServer as createHttpsServer } from 'https';
import { createServer as createHttpServer } from 'http';
import { readFileSync, existsSync } from 'fs';

const app = express();
const bare = createBareServer('/bare/');

const PORT = process.env.PORT || 8080;

// Serve static files
const staticPath = fileURLToPath(new URL('./static/', import.meta.url));
app.use(express.static(staticPath));

let server;

if (existsSync('key.pem') && existsSync('cert.pem')) {
  const options = {
    key: readFileSync('key.pem'),
    cert: readFileSync('cert.pem')
  };
  server = createHttpsServer(options, app);
} else {
  server = createHttpServer(app);
}

// Route requests
app.use((req, res, next) => {
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else {
    res.status(500).send('Error');
  }
});

// Handle WebSocket upgrades
server.on('upgrade', (req, socket, head) => {
  if (bare.shouldRoute(req, socket, head)) {
    bare.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

server.listen(PORT, () => {
  const addr = server.address();
  console.log(`Server running on port ${addr.port}`);
  console.log('');
  console.log('You can now view it in your browser.');
  console.log(`Local: http://${addr.family === 'IPv6' ? `[${addr.address}]` : addr.address}:${addr.port}`);
  try { console.log(`On Your Network: http://${address.ip()}:${addr.port}`); } catch (err) { /* Can't find LAN interface */ }
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    console.log(`Replit: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
  }
});
