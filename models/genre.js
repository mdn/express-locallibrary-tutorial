var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GenreSchema = Schema({
    name: {type: String, required: true}
});

// Virtual for this genre instance URL
GenreSchema
.virtual('url')
.get(function () {
  return '/catalog/genre/'+this._id
});

//Export model
module.exports = mongoose.model('Genre', GenreSchema);