var express = require('express');
var router = express.Router();

// Require user controller.
var userController = require('../controllers/userController');

// Handler for all types of requests pointed to '/' route.
router.all('/', function(req, res) {
  // We don't have a 'landing page' for users route.
  // So, redirect to home page.
  res.redirect('/');
});

// GET request for login page.
router.get('/login', userController.login_get);

// POST request for login page.
router.post('/login', userController.login_post);

// GET request for logout page.
router.get('/logout', userController.logout_get);

// GET request for create User.
router.get('/register', userController.register_get);

// POST request for create User.
router.post('/register', userController.register_post);

// GET request for reset User password.
router.get('/reset', userController.reset_get);

// POST request for reset User password (1st step).
router.post('/reset', userController.reset_post);

// POST request for reset User password (2nd step).
router.post('/resetfinal', userController.reset_post_final);

// GET request for User permission reminder page.
router.get('/stop', userController.warning);

// GET request for a specific User.
router.get('/:id', userController.user_profile);

// GET request for update User.
router.get('/:id/update', userController.update_get);

// POST request for update User.
router.post('/:id/update', userController.update_post);

module.exports = router;
