const mongoose = require('mongoose');
const { DateTime } = require("luxon");  //for date handling

const Schema = mongoose.Schema;

const BookInstanceSchema = new Schema({
    book: { type: Schema.ObjectId, ref: 'Book', required: true }, // Reference to the associated book.
    imprint: {type: String, required: true},
    status: {type: String, required: true, enum:['Available', 'Maintenance', 'Loaned', 'Reserved'], default:'Maintenance'},
    due_back: { type: Date, default: Date.now },
});

// Virtual for this bookinstance object's URL.
BookInstanceSchema
.virtual('url')
.get(function () {
  return '/catalog/bookinstance/'+this._id;
});


BookInstanceSchema
.virtual('due_back_formatted')
.get(function () {
  return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED);
});

BookInstanceSchema
.virtual('due_back_yyyy_mm_dd')
.get(function () {
  return DateTime.fromJSDate(this.due_back).toISODate(); //format 'YYYY-MM-DD'
});


// Export model.
module.exports = mongoose.model('BookInstance', BookInstanceSchema);
