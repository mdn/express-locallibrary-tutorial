var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');

var UserSchema = new Schema({
  username: { type: String, required: true },
  fullname: { type: String, required: true },
  role: {
    type: Number,
    enum: [
      0, // Regular user: read-only access
      1, // Editor: read, create and update access
      2 // Admin: read, create, update, delete access
    ],
    default: 0
  },
  email: { type: String, required: true },
  salt: { type: String, required: true },
  hash: { type: String, required: true }
});

// Virtual for User's URL.
UserSchema.virtual('url').get(function() {
  return '/users/' + this._id;
});

// Instance method for hashing user-typed password.
UserSchema.methods.setPassword = function(password) {
  // Create a salt for the user.
  this.salt = crypto.randomBytes(16).toString('hex');
  // Use salt to create hashed password.
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 128, 'sha512').toString('hex');
};

// Instance method for comparing user-typed password against hashed-password on db.
UserSchema.methods.validatePassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 128, 'sha512').toString('hex');
  return this.hash === hash;
};

// Instance method for comparing user-typed passwords against each other.
UserSchema.methods.passwordsMatch = function(password, passwordConfirm) {
  return password === passwordConfirm;
};

// Export model
module.exports = mongoose.model('User', UserSchema);
