/*
const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const User = require('../models/User');

// Load Google OAuth client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

router.get("/calendar", async (req, res) => {
  try {
    // Get all coaches in the system
    const coaches = await User.find({ role: "coach" });

    const allCoachEvents = [];

    for (const coach of coaches) {

      // Coach has never connected Google Calendar
      if (!coach.googleTokens || !coach.googleTokens.access_token) {
        allCoachEvents.push({
          coachId: coach._id,
          coachName: coach.name,
          expertise: coach.expertise || [],
          notConnected: true,
          events: []
        });
        continue;
      }

      // Coach HAS connected — set credentials
      oauth2Client.setCredentials({
        access_token: coach.googleTokens.access_token,
        refresh_token: coach.googleTokens.refresh_token
      });


      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      let events = [];
      try {
        const result = await calendar.events.list({
          calendarId: "primary",
          timeMin: new Date().toISOString(),
          maxResults: 20,
          singleEvents: true,
          orderBy: "startTime"
        });

        events = result.data.items || [];

      } catch (err) {
        console.log(`Google Calendar fetch failed for ${coach.name}:`, err);
      }

      allCoachEvents.push({
        coachId: coach._id,
        coachName: coach.name,
        expertise: coach.expertise || [],
        notConnected: false,
        events
      });
    }

    // Render with correct variable
    res.render("student-calendar", {allCoachEvents });

  } catch (err) {
    console.log(err);
    res.send("Error loading calendar");
  }
});


router.post('/book', async (req, res) => {
  const { coachId, dateTimeStart, dateTimeEnd } = req.body;

  const isEnrolled = student.enrolledCoachIds.some(id => id.equals(coachId));
  if (!isEnrolled) {
    return res.status(403).send('You are not enrolled with this coach.');
  }

  const student = await User.findById(req.session.userId);
  const coach = await User.findById(coachId);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials(coach.googleTokens);

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `Session with ${student.name}`,
      start: { dateTime: dateTimeStart },
      end: { dateTime: dateTimeEnd },
      attendees: [{ email: student.email }]
    }
  });

  res.send('Booking confirmed!');
});


module.exports = router;
*/





const express = require('express');
const router = express.Router();
const Coach = require('../models/User'); // your User model
const { google } = require('googleapis');
const { getOAuthClient } = require('../utils/googleClient');

router.get('/calendar', async (req, res) => {
  const assignedCoaches = await Coach.find({ role: 'coach' }); // filter by assigned coaches as needed
  const allCoachEvents = [];

  for (let coach of assignedCoaches) {
    let notConnected = false;
    let events = [];

    if (coach.googleTokens && coach.googleTokens.refresh_token) {
      try {
        const oauth2Client = getOAuthClient(coach);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: (new Date()).toISOString(),
          maxResults: 10,
          singleEvents: true,
          orderBy: 'startTime',
        });

        events = response.data.items.map(e => ({
          id: e.id,
          summary: e.summary || "No title",
          start: e.start,
          end: e.end,
          isBooked: false, // you can update from your DB if already booked
        }));

      } catch (err) {
        console.error('Calendar fetch error', err.response?.data || err.message);
        notConnected = true;
      }
    } else {
      notConnected = true;
    }

    allCoachEvents.push({
      coachId: coach._id,
      coachName: coach.name,
      expertise: coach.expertise,
      events,
      notConnected
    });
  }

  res.render("student-calendar", { allCoachEvents, session: req.session });
});

router.post('/book', async (req, res) => {
  const { coachId, eventId } = req.body;
  const coach = await Coach.findById(coachId);

  if (!coach) return res.send("Coach not found");

  try {
    const oauth2Client = getOAuthClient(coach);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Fetch the event
    const event = await calendar.events.get({ calendarId: 'primary', eventId });

    // Add student as attendee
    event.data.attendees = event.data.attendees || [];
    event.data.attendees.push({
      email: req.session.email,
      displayName: req.session.name
    });

    await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: event.data
    });

    // Optional: save booking in your DB
    // ...

    res.redirect('/student/calendar');

  } catch (err) {
    console.error('Booking error:', err.response?.data || err.message);

    // Handle token expired / revoked
    if (err.response?.data?.error === 'invalid_grant') {
      return res.send('Coach must reconnect Google Calendar.');
    }

    res.send('Error booking the slot.');
  }
});


module.exports = router;
