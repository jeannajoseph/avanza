const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { google } = require('googleapis');

// --- OAUTH CLIENT ---
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/auth/google/callback"
);

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

// --- REGISTER / LOGIN ROUTES REMAIN SAME ---

router.get('/register', (req, res) => { res.render('register'); }); 
router.post('/register', async (req, res) => { const { name, email, password, role } = req.body; const passwordHash = await bcrypt.hash(password, 10); const user = new User({ name, email, passwordHash, role }); await user.save(); req.session.userId = user._id; req.session.role = user.role; res.redirect(role === 'coach' ? '/coach/dashboard' : '/student/calendar'); });
router.get('/login', (req, res) => { res.render('login'); }); 
router.post('/login', async (req, res) => { const { email, password } = req.body; const user = await User.findOne({ email }); if (!user || !(await user.verifyPassword(password))) { return res.send('Invalid credentials'); } req.session.userId = user._id; req.session.role = user.role; res.redirect(user.role === 'coach' ? '/coach/dashboard' : '/student/calendar'); });


// -------- GOOGLE OAUTH: STEP 1 --------
router.get("/auth/google", (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES
  });

  res.redirect(url);
});


// -------- GOOGLE OAUTH: STEP 2 (CALLBACK) --------
router.get("/auth/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save tokens to coach
    const coach = await User.findById(req.session.userId);

    if (!coach) return res.send("No user session found.");

    coach.googleTokens = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      expiry_date: tokens.expiry_date
    };

    await coach.save();

    res.redirect("/coach-dashboard");

  } catch (err) {
    console.error(err);
    res.send("OAuth Error");
  }
});

module.exports = router;
