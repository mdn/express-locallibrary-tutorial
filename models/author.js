import mongoose from "mongoose";

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
  first_name: { type: String, required: true, maxLength: 100 },
  family_name: { type: String, required: true, maxLength: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date },
});

// Virtual for author's full name
AuthorSchema.virtual("name").get(function () {
  // To avoid errors in cases where an author does not have either a family name or first name
  // We want to make sure we handle the exception by returning an empty string for that case
  let fullname = "";
  if (this.first_name && this.family_name) {
    fullname = `${this.family_name}, ${this.first_name}`;
  }

  return fullname;
});

// Virtual for author's URL
AuthorSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/catalog/author/${this._id}`;
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

AuthorSchema.virtual("lifespan").get(function () {
  const birth = this.date_of_birth ? dateFormatter.format(this.date_of_birth) : "";
  const death = this.date_of_death ? dateFormatter.format(this.date_of_death) : "";
  return `${birth} - ${death}`;
});

AuthorSchema.virtual("date_of_birth_yyyy_mm_dd").get(function () {
  return this.date_of_birth ? this.date_of_birth.toISOString().slice(0, 10) : "";
});

AuthorSchema.virtual("date_of_death_yyyy_mm_dd").get(function () {
  return this.date_of_death ? this.date_of_death.toISOString().slice(0, 10) : "";
});

// Export model
export default mongoose.model("Author", AuthorSchema);
