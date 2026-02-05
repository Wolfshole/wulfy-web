import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import DiscordStrategy from 'passport-discord';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as TwitchStrategy } from 'passport-twitch-new';

dotenv.config();

const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    domain: 'localhost'
  }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: process.env.DISCORD_REDIRECT_URI,
  scope: ['identify', 'email']
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

// Google OAuth2 Strategy (nur laden wenn konfiguriert)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
    scope: ['profile', 'email']
  }, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }));
}

// Twitch OAuth Strategy (nur laden wenn konfiguriert)
if (process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
  passport.use(new TwitchStrategy({
    clientID: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
    callbackURL: process.env.TWITCH_REDIRECT_URI || 'http://localhost:3000/auth/twitch/callback',
    scope: 'user:read:email'
  }, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }));
}

app.get('/auth/discord', passport.authenticate('discord'));
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  app.get('/auth/google', passport.authenticate('google'));
}
if (process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
  app.get('/auth/twitch', passport.authenticate('twitch'));
}

app.get('/auth/discord/callback', passport.authenticate('discord', {
  failureRedirect: 'http://localhost:4321/login'
}), (req, res) => {
  const adminUsernames = ['Wulfy', 'UEBlackWulfGHG', 'ueblackwulf', 'ueblackwolf'];
  const username = req.user && req.user.username ? req.user.username.toLowerCase() : '';
  const isAdmin = adminUsernames.some(admin => admin.toLowerCase() === username);
  
  const userData = {
    username: req.user.username,
    email: req.user.email,
    avatar: req.user.avatar,
    provider: 'discord',
    isAdmin: isAdmin
  };
  
  const redirectTo = isAdmin ? '/dashboard' : '/';
  const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
  
  res.redirect(`http://localhost:4321/auth-success?user=${userDataEncoded}&redirect=${redirectTo}`);
});

app.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: 'http://localhost:4321/login'
}), (req, res) => {
  const adminEmails = ['deinadmin@email.de', 'e94111993@gmail.com'];
  const email = req.user && req.user.emails && req.user.emails[0] ? req.user.emails[0].value.toLowerCase() : '';
  const isAdmin = adminEmails.some(admin => admin.toLowerCase() === email);
  
  const userData = {
    username: req.user.displayName,
    email: email,
    avatar: req.user.photos && req.user.photos[0] ? req.user.photos[0].value : '',
    provider: 'google',
    isAdmin: isAdmin
  };
  
  const redirectTo = isAdmin ? '/dashboard' : '/';
  const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
  
  res.redirect(`http://localhost:4321/auth-success?user=${userDataEncoded}&redirect=${redirectTo}`);
});

app.get('/auth/twitch/callback', passport.authenticate('twitch', {
  failureRedirect: 'http://localhost:4321/login'
}), (req, res) => {
  const adminUsernames = ['ueblackwolf']; // Passe deinen Twitch-Username an
  const username = req.user && req.user.login ? req.user.login.toLowerCase() : '';
  const isAdmin = adminUsernames.some(admin => admin.toLowerCase() === username);
  
  const userData = {
    username: req.user.display_name || req.user.login,
    email: req.user.email || '',
    avatar: req.user.profile_image_url || '',
    provider: 'twitch',
    isAdmin: isAdmin
  };
  
  const redirectTo = isAdmin ? '/dashboard' : '/';
  const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
  
  res.redirect(`http://localhost:4321/auth-success?user=${userDataEncoded}&redirect=${redirectTo}`);
});

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('http://localhost:4321/logout-success');
  });
});

app.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('http://localhost:4321/login');
  res.json(req.user);
});

// Astro als Middleware einbinden (optional - auskommentiert)
// app.use(await startServer({
//   projectRoot: './',
//   mode: 'middleware'
// }));

app.listen(3000, () => {
  console.log('Server läuft auf http://localhost:3000');
});
