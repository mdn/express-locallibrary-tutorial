// test/routes/catalog.test.js

const request = require("supertest"); // For testing HTTP endpoints
const { expect } = require("chai"); // For assertions (use 'expect' style)

// Import the Express app
const app = require("../../app");

// Set up test database
const testDB = require("../utils/test_db");

// Import models used in BookInstance route tests
const Genre = require("../../models/genre");
const Author = require("../../models/author");
const Book = require("../../models/book");
const BookInstance = require("../../models/bookinstance");

describe("BookInstance Routes", () => {
  // Connect to the test database before running tests
  before(async () => {
    await testDB.connect();
  });

  // Close the test database connection after all tests
  after(async () => {
    await testDB.close();
  });

  // Clear the test database before each test
  beforeEach(async () => {
    await testDB.clearDatabase();
  });

  describe("BookInstance List Routes", () => {
    describe("GET /catalog/bookinstances", () => {
      it("should return 200 and contain 'Book Instance List' or similar text", async () => {
        const res = await request(app)
          .get("/catalog/bookinstances")
          .expect(200);
        // Adjust the text to match what's rendered in your view
        expect(res.text.toLowerCase()).to.include("book instance list");
      });
    });
  });

  describe("BookInstance Detail Routes", () => {
    it("should return BookInstance detail page for existing instance", async () => {
      // Create dependencies: author, genre, book
      const author = await Author.create({
        first_name: "Douglas",
        family_name: "Adams",
        date_of_birth: new Date("1952-03-11"),
      });

      const genre = await Genre.create({ name: "Comedy Sci-Fi" });

      const book = await Book.create({
        title: "The Hitchhiker's Guide to the Galaxy",
        author: author._id,
        summary: "A comedic science fiction series.",
        isbn: "9876543210",
        genre: [genre._id],
      });

      // Create the BookInstance
      const bookInstance = await BookInstance.create({
        book: book._id,
        imprint: "42nd Printing, Pan Books",
        status: "Available",
        due_back: new Date(), // optional
      });

      const res = await request(app)
        .get(`/catalog/bookinstance/${bookInstance._id}`)
        .expect(200);

      expect(res.text).to.include("Hitchhiker");
      expect(res.text).to.include("Available");
      expect(res.text).to.include("42nd Printing");
    });

    it("should return 404 for non-existent BookInstance", async () => {
      const fakeId = "64f1e0aa6a429f0f8d0d0d0d"; // valid ObjectId format, doesn't exist
      await request(app).get(`/catalog/bookinstance/${fakeId}`).expect(404);
    });
  });

  describe("BookInstance Delete Routes", () => {
    let bookInstance;
    let book;

    beforeEach(async () => {
      // Create author and genre for the book
      const author = await Author.create({
        first_name: "Test",
        family_name: "Author",
        date_of_birth: "1970-01-01",
      });

      const genre = await Genre.create({ name: "Test Genre" });

      book = await Book.create({
        title: "Test Book",
        author: author._id,
        summary: "Summary here",
        isbn: "1234567890",
        genre: [genre._id],
      });

      bookInstance = await BookInstance.create({
        book: book._id,
        imprint: "Library Copy 1",
        status: "Available",
        due_back: new Date("2025-12-31"),
      });
    });

    it("should load the BookInstance delete confirmation page", async () => {
      const res = await request(app)
        .get(`/catalog/bookinstance/${bookInstance._id}/delete`)
        .expect(200);

      expect(res.text).to.include("Delete BookInstance");
      expect(res.text).to.include("Library Copy 1");
    });

    it("should delete the BookInstance and redirect to BookInstance list", async () => {
      const res = await request(app)
        .post(`/catalog/bookinstance/${bookInstance._id}/delete`)
        .type("form")
        .send({ id: bookInstance._id.toString() })
        .expect(302);

      expect(res.headers.location).to.equal("/catalog/bookinstances");

      const found = await BookInstance.findById(bookInstance._id);
      expect(found).to.be.null;
    });
  });

  describe("BookInstance Create Routes", () => {
    let book;

    beforeEach(async () => {
      const author = await Author.create({
        first_name: "Form",
        family_name: "Author",
        date_of_birth: "1980-01-01",
      });

      const genre = await Genre.create({ name: "Thriller" });

      book = await Book.create({
        title: "Instance Target Book",
        author: author._id,
        summary: "A thrilling book",
        isbn: "2222222222",
        genre: [genre._id],
      });
    });

    it("should render the BookInstance creation form", async () => {
      const res = await request(app)
        .get("/catalog/bookinstance/create")
        .expect(200);

      expect(res.text).to.include("Create BookInstance");
      expect(res.text).to.include("Status");
    });

    it("should create a new BookInstance and redirect to detail", async () => {
      const res = await request(app)
        .post("/catalog/bookinstance/create")
        .type("form")
        .send({
          book: book._id.toString(),
          imprint: "Test Imprint Copy",
          status: "Available",
          due_back: "2030-01-01",
        })
        .expect(302);

      // Find the newly created BookInstance
      const instance = await BookInstance.findOne({
        imprint: "Test Imprint Copy",
      });

      expect(instance).to.not.be.null;
      expect(res.headers.location).to.equal(
        `/catalog/bookinstance/${instance._id}`
      );
    });

    it("should re-render the form with errors if (most) required fields are missing", async () => {
      const res = await request(app)
        .post("/catalog/bookinstance/create")
        .type("form")
        .send({
          book: book._id.toString(), // If empty string crashes.
          imprint: "", // missing imprint
          status: "Available",
          due_back: "", // optional, but book and imprint are required
        })
        .expect(200);

      expect(res.text).to.include("Create BookInstance");
      expect(res.text).to.include("Imprint must be specified");
    });
  });

  // BookInstance Update Routes
  describe("BookInstance Update Routes", () => {
    let author, genre, book, bookInstance;

    beforeEach(async () => {
      author = await Author.create({
        first_name: "Instance",
        family_name: "Author",
        date_of_birth: "1970-01-01",
      });

      genre = await Genre.create({ name: "Adventure" });

      book = await Book.create({
        title: "Adventure Book",
        author: author._id,
        summary: "A book with thrilling adventures.",
        isbn: "1122334455",
        genre: [genre._id],
      });

      bookInstance = await BookInstance.create({
        book: book._id,
        imprint: "1st Edition",
        status: "Available",
        due_back: new Date("2025-12-31"),
      });
    });

    it("should render the bookinstance update form", async () => {
      const res = await request(app)
        .get(`/catalog/bookinstance/${bookInstance._id}/update`)
        .expect(200);

      expect(res.text).to.include("Update BookInstance");
      expect(res.text).to.include("1st Edition");
    });

    it("should update the bookinstance and redirect to detail page", async () => {
      const res = await request(app)
        .post(`/catalog/bookinstance/${bookInstance._id}/update`)
        .type("form")
        .send({
          book: book._id.toString(),
          imprint: "2nd Edition",
          status: "Loaned",
          due_back: "2026-01-15",
          bookinstanceid: bookInstance._id.toString(), // Required in controller
        })
        .expect(302);

      expect(res.headers.location).to.equal(
        `/catalog/bookinstance/${bookInstance._id}`
      );

      const updated = await BookInstance.findById(bookInstance._id);
      expect(updated.imprint).to.equal("2nd Edition");
      expect(updated.status).to.equal("Loaned");
      expect(updated.due_back.toISOString().startsWith("2026-01-15")).to.be
        .true;
    });

    it("should re-render form with errors if required fields are missing", async () => {
      const res = await request(app)
        .post(`/catalog/bookinstance/${bookInstance._id}/update`)
        .type("form")
        .send({
          book: book._id.toString(),
          imprint: "",
          status: "",
          due_back: "",
          bookinstanceid: bookInstance._id.toString(),
        })
        .expect(200); // should re-render form

      expect(res.text).to.include("Update BookInstance");
      expect(res.text).to.include("Imprint must be specified");
      //expect(res.text).to.include("Book must be specified");
    });
  });
});
