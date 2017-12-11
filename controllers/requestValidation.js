const { check,body,validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');

// Array of validation and sanitization handlers for genre_create_post
exports.genre_create_post_validation = [
    //Check that the name field is not empty also Trim and escape the name field.
    body('name', 'Genre name required').isLength({ min: 1 }).trim().escape()
];