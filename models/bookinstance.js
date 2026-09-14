import mongoose from "mongoose";

const Schema = mongoose.Schema;

const BookInstanceSchema = new Schema({
  book: { type: Schema.Types.ObjectId, ref: "Book", required: true }, // reference to the associated book
  imprint: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ["Available", "Maintenance", "Loaned", "Reserved"],
    default: "Maintenance",
  },
  due_back: { type: Date, default: Date.now },
});

// Virtual for bookinstance's URL
BookInstanceSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/catalog/bookinstance/${this._id}`;
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

BookInstanceSchema.virtual("due_back_formatted").get(function () {
  return dateFormatter.format(this.due_back);
});

BookInstanceSchema.virtual("due_back_yyyy_mm_dd").get(function () {
  return this.due_back ? this.due_back.toISOString().slice(0, 10) : "";
});

// Export model
export default mongoose.model("BookInstance", BookInstanceSchema);
