import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import DiscordStrategy from 'passport-discord';
import { startServer } from '@astrojs/node';

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

app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback', passport.authenticate('discord', {
  failureRedirect: '/login'
}), (req, res) => {
  // Erfolgreich eingeloggt
  // Prüfe ob Admin
  const adminUsernames = ['Wulfy', 'UEBlackWulfGHG', 'ueblackwulf', 'ueblackwolf'];
  const username = req.user && req.user.username ? req.user.username.toLowerCase() : '';
  const isAdmin = adminUsernames.some(admin => admin.toLowerCase() === username);
  if (isAdmin) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/');
  }
});

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

app.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/login');
  res.json(req.user);
});

// Astro als Middleware einbinden
app.use(await startServer({
  projectRoot: './', // Pfad zu deinem Astro-Projekt
  mode: 'middleware'
}));

app.listen(3000, () => {
  console.log('Server läuft auf http://localhost:3000');
});
