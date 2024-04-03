export function hi(){
    const Passport = require('passport');
const discordauth = require('discord-passport');
const discordClientId = process.env.DISCORD_CLIENT_ID;
const discordClientSecret = process.env.DISCORD_CLIENT_SECRET;
const scopes = ['identify', 'email', 'guilds'];


Passport.use(new discordauth({
    clientID: discordClientId,
    clientSecret: discordClientSecret,
    callbackURL: `/auth/discord/callback`,
    scope: scopes,
},
function(accessToken, refreshToken, profile, cb){
    User.findOrCreate({ discordId: profile.id }, function(err, user) {
        return cb(err, user);
    });
}));
};