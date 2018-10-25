var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var auth = require('./lib/auth');
var index = require('./routes/index');
var users = require('./routes/users');
var catalog = require('./routes/catalog'); // Import routes for 'catalog' area of site
var compression = require('compression');
var helmet = require('helmet');

// Create the Express application object
var app = express();

// Set up mongoose connection
var mongoose = require('mongoose');
var dev_db_url = 'mongodb://cooluser:coolpassword@ds119748.mlab.com:19748/local_library';
var mongoDB = process.env.MONGODB_URI || dev_db_url;
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Authentication Packages
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');
var flash = require('express-flash');
var MongoStore = require('connect-mongo')(session);

// Configure the local strategy for use by Passport.
passport.use(
  new LocalStrategy(function(username, password, callback) {
    User.findOne({ username: username }, function(err, user) {
      if (err) {
        return callback(err);
      }
      if (!user) {
        return callback(null, false, { message: 'Incorrect username. ' });
      }
      if (!user.validatePassword(password)) {
        return callback(null, false, { message: 'Incorrect password.' });
      }
      return callback(null, user);
    });
  })
);

// Configure Passport authenticated session persistence.
passport.serializeUser(function(user, callback) {
  callback(null, user._id);
});

passport.deserializeUser(function(id, callback) {
  User.findById(id, function(err, user) {
    if (err) {
      return callback(err);
    }
    callback(null, user);
  });
});

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(compression()); // Compress all routes
app.use(helmet());

app.use(express.static(path.join(__dirname, 'public')));

// Authentication related middleware.
app.use(flash());
app.use(
  session({
    secret: 'local-library-session-secret',
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
      url: mongoDB,
      ttl: 7 * 24 * 60 * 60 // 7 days. 14 Default.
    })
    // cookie: { secure: true }
  })
);

// Initialize Passport and restore authentication state, if any,
// from the session.
app.use(passport.initialize());
app.use(passport.session());

// Pass isAuthenticated and current_user to all views.
app.use(function(req, res, next) {
  res.locals.isAuthenticated = req.isAuthenticated();
  // Delete salt and hash fields from req.user object before passing it.
  var safeUser = req.user;
  if (safeUser) {
    delete safeUser._doc.salt;
    delete safeUser._doc.hash;
  }
  res.locals.current_user = safeUser;
  next();
});

// Use our Authentication and Authorization middleware.
app.use(auth);

app.use('/', index);
app.use('/users', users);
app.use('/catalog', catalog); // Add catalog routes to middleware chain.

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handler
app.use(function(err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
