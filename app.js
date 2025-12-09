/*
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// In-memory appointment store
const appointments = [];

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/schedule', (req, res) => {
    res.render('schedule', { appointments });
});

app.post('/book', (req, res) => {
  const { studentName, timeSlot } = req.body;
  appointments.push({ studentName, timeSlot });
  res.redirect('/schedule');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


const mongoose = require('mongoose');
// const Student = require('./models/Student');
// const Coach = require('./models/Coach');
const User = require('./models/User');
const Appointment = require('./models/Appointment');

mongoose.connect('mongodb://localhost:27017/scheduler', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('Connection error:', err);
});
*/


/*
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

require('dotenv').config();

const app = express();

// --- DATABASE ---
mongoose.connect('mongodb://localhost:27017/scheduler');

// --- MIDDLEWARE MUST COME FIRST ---
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false
}));

// --- VIEW ENGINE ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// --- ROUTES ---
app.use('/', require('./routes/auth'));
app.use('/student', require('./routes/student'));
app.use('/coach', require('./routes/coach'));
// PUBLIC PAGES
app.get('/', (req, res) => res.render('home', { session: req.session, page: 'home' }));
app.get('/about', (req, res) => res.render('about', { session: req.session, page: 'about' }));
app.get('/services', (req, res) => res.render('services', { session: req.session, page: 'services' }));
app.get('/contact', (req, res) => res.render('contact', { session: req.session, page: 'contact' }));

app.get('/login', (req, res) => res.render('login', { session: req.session, page: 'login' }));
app.get('/register', (req, res) => res.render('register', { session: req.session, page: 'register' }));


app.get('/', (req, res) => {
  if (!req.session.userId) return res.redirect('/login', { session: req.session, page: 'login' });
  res.redirect(req.session.role === 'coach' ? '/coach/dashboard' : '/student/calendar');
});

app.listen(3000, () => console.log('Server on http://localhost:3000'));
*/



const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

require('dotenv').config();

const app = express();

// =============================
// DATABASE
// =============================
mongoose.connect('mongodb://localhost:27017/scheduler');

// =============================
// MIDDLEWARE
// =============================
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false
}));

// Make session available in all EJS views automatically
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// =============================
// VIEW ENGINE
// =============================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// =============================
// ROUTES
// =============================

// Auth routes
app.use('/', require('./routes/auth'));

// Role-based features
app.use('/student', require('./routes/student'));
app.use('/coach', require('./routes/coach'));


// -----------------------------
// PUBLIC PAGES
// -----------------------------
app.get('/', (req, res) => {
  res.render('home', { page: 'home' });
});

app.get('/about', (req, res) => {
  res.render('about', { page: 'about' });
});

app.get('/services', (req, res) => {
  res.render('services', { page: 'services' });
});

app.get('/contact', (req, res) => {
  res.render('contact', { page: 'contact' });
});


// -----------------------------
// LOGIN / REGISTER / LOGOUT
// -----------------------------
app.get('/login', (req, res) => {
  res.render('login', { page: 'login' });
});

app.get('/register', (req, res) => {
  res.render('register', { page: 'register' });
});
// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.send('Error logging out');
    }
    res.redirect('/login'); // redirect to login page after logout
  });
});



// -----------------------------
// DASHBOARD REDIRECT LOGIC
// (Clean, no conflicts with "/")
// -----------------------------
app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  return res.redirect(
    req.session.role === 'coach'
      ? '/coach/dashboard'
      : '/student/calendar'
  );
});


// =============================
// SERVER START
// =============================
app.listen(3000, () => console.log('Server on http://localhost:3000'));
