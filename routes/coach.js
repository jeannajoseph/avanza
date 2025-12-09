/*

const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/dashboard', async (req, res) => {
  const coach = await User.findById(req.session.userId).populate('availability.student');
  res.render('coach-dashboard', { coach });
});

module.exports = router;

*/

const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const User = require('../models/User'); // your User model
const { getOAuthClient } = require('../utils/googleClient');

// Middleware to ensure coach is logged in
function ensureCoach(req, res, next) {
  if (!req.session.userId || req.session.role !== 'coach') {
    return res.redirect('/login');
  }
  next();
}

// -------------------------------
// Coach Dashboard
// -------------------------------
router.get('/dashboard', ensureCoach, async (req, res) => {
  try {
    const coach = await User.findById(req.session.userId);

    let calendarEvents = [];
    let googleConnected = false;

    if (coach.googleTokens && coach.googleTokens.refresh_token) {
      try {
        const oauth2Client = getOAuthClient(coach);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: (new Date()).toISOString(),
          maxResults: 20,
          singleEvents: true,
          orderBy: 'startTime',
        });

        calendarEvents = response.data.items.map(e => ({
          id: e.id,
          summary: e.summary || "No title",
          start: e.start.dateTime || e.start.date,
          end: e.end.dateTime || e.end.date,
          attendees: e.attendees || []
        }));

        googleConnected = true;

      } catch (err) {
        console.error('Error fetching calendar events:', err.response?.data || err.message);
        googleConnected = false;
      }
    }

    res.render('coach-dashboard', {
      coach,
      googleConnected,
      calendarEvents
    });

  } catch (err) {
    console.error(err);
    res.send('Error loading dashboard');
  }
});

// -------------------------------
// Connect Google Calendar
// -------------------------------
router.get('/google/connect', ensureCoach, (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:3000/auth/google/callback"
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar"]
  });

  res.redirect(url);
});

// -------------------------------
// Add availability manually (optional)
// -------------------------------
router.post('/availability', ensureCoach, async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    const coach = await User.findById(req.session.userId);

    if (!coach.availability) coach.availability = [];

    coach.availability.push({
      date: new Date(date),
      startTime,
      endTime,
      isBooked: false,
      student: null
    });

    await coach.save();
    res.redirect('/coach-dashboard');

  } catch (err) {
    console.error(err);
    res.send('Error adding availability');
  }
});

module.exports = router;

