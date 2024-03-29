import express from 'express';
import { createBareServer } from '@tomphttp/bare-server-node';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();
import { createServer as createHttpServer } from 'http';
import { readFileSync, existsSync, } from 'fs';
import path from 'path'; 
import Passport from 'passport';
import DiscordStrategy from 'passport-discord';
import { time } from 'console';
const discordClientId = process.env.DISCORD_CLIENT_ID;
const discordClientSecret = process.env.DISCORD_CLIENT_SECRET;
const scopes = ['identify', 'email', 'guilds'];


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const bare = createBareServer("/bare/");
dotenv.config();


Passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: `http://localhost:${PORT}/auth/discord/callback`,
    scope: ['identify', 'email', 'guilds'],
  },
  function(accessToken, refreshToken, profile, cb) {
    // Write user data to a text file
    fs.appendFile('users.txt', JSON.stringify(profile) + '\n', (err) => {
        if (err) {
            console.error('Error writing user data to file:', err);
            return cb(err);
        }
        console.log('User data written to file:', profile);
        return cb(null, profile);
    });
  }
));

app.get('/auth/discord', Passport.authenticate('discord'));

app.get('/auth/discord/callback', Passport.authenticate('discord', {
    failureRedirect: '/'
}), function(req, res) {
    res.redirect('/apps/'); 
    // Get down on your knees and pray to god this work
});

app.use(express.static(path.join(__dirname, 'static')));


app.get('/apps/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'apps.html'));
});

const routes = [
    { path: '/~', file: 'apps.html' },
    { path: '/0', file: 'tabs.html' },
    { path: '/1', file: 'go.html' },
    { path: '/', file: 'index.html' },
];

routes.forEach((route) => {
    app.get(route.path, (req, res) => {
        res.sendFile(path.join(__dirname, 'static', route.file));
    });
});

let server;

if (existsSync(path.join(__dirname, 'key.pem')) && existsSync(path.join(__dirname, 'cert.pem'))) {
    const options = {
        key: readFileSync(path.join(__dirname, 'key.pem')),
        cert: readFileSync(path.join(__dirname, 'cert.pem'))
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
