// test/routes/catalog.test.js

const request = require("supertest"); // For testing HTTP endpoints
const { expect } = require("chai"); // For assertions (use 'expect' style)

// Import the Express app and create it.
const { createApp } = require("../../app");
const app = createApp();

// Set up test database
const testDB = require("../utils/test_db");

// Import models used in Book route tests
const Genre = require("../../models/genre");
const Author = require("../../models/author");
const Book = require("../../models/book");
const BookInstance = require("../../models/bookinstance");

describe("Book Routes", () => {
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

  describe("Book List Routes", () => {
    describe("GET /catalog/books", () => {
      it("should return 200 and contain 'Book List' or similar text", async () => {
        const res = await request(app).get("/catalog/books").expect(200);
        // Adjust the text to match what's rendered in your view
        expect(res.text.toLowerCase()).to.include("book");
      });
    });
  });

  describe("Book Detail Routes", () => {
    it("should return book detail page for existing book", async () => {
      // Create required dependencies first
      const author = await Author.create({
        first_name: "Jimmy",
        family_name: "Jones",
        date_of_birth: new Date("1920-10-08"),
      });

      const genre = await Genre.create({ name: "Fan Fiction" });

      // Create the test book
      const book = await Book.create({
        title: "Happy",
        author: author._id,
        summary: "A fan-fiction masterpiece.",
        isbn: "1234447890",
        genre: [genre._id],
      });

      const res = await request(app)
        .get(`/catalog/book/${book._id}`)
        .expect(200);

      expect(res.text).to.include("Happy");
      expect(res.text).to.include("Jones");
      expect(res.text).to.include("Fan Fiction");
    });

    it("should return 404 for non-existent book", async () => {
      const fakeId = "64f1e0aa6a429f0f8d0d0d0d"; // valid but not in DB
      await request(app).get(`/catalog/book/${fakeId}`).expect(404);
    });
  });

  describe("Book Delete Routes", () => {
    let book;

    beforeEach(async () => {
      // Create dependencies
      const author = await Author.create({
        first_name: "Test",
        family_name: "Author",
        date_of_birth: "1970-01-01",
      });

      const genre = await Genre.create({ name: "Test Genre" });

      book = await Book.create({
        title: "Delete Me",
        author: author._id,
        summary: "To be deleted",
        isbn: "123456789X",
        genre: [genre._id],
      });
    });

    it("should load the book delete confirmation page", async () => {
      const res = await request(app)
        .get(`/catalog/book/${book._id}/delete`)
        .expect(200);

      expect(res.text).to.include("Delete Book");
      expect(res.text).to.include("Delete Me");
    });

    it("should delete the book and redirect to book list", async () => {
      const res = await request(app)
        .post(`/catalog/book/${book._id}/delete`)
        .type("form") // Simulates form POST
        .send({ id: book._id.toString() }) // This is where server gets the ID
        .expect(302);

      expect(res.headers.location).to.equal("/catalog/books");

      // Confirm it's deleted
      const found = await Book.findById(book._id);

      expect(found).to.be.null;
    });

    it("should NOT delete the Book if BookInstances exist", async () => {
      await BookInstance.create({
        book: book._id,
        imprint: "Library Copy 1",
        status: "Available",
        due_back: new Date("2025-12-31"),
      });

      const res = await request(app)
        .post(`/catalog/book/${book._id}/delete`)
        .type("form")
        .send({ id: book._id.toString() })
        .expect(200);

      const found = await Book.findById(book._id);
      expect(found).to.not.be.null;

      expect(res.text).to.include("Delete Book");
      expect(res.text).to.include("Library Copy 1");
    });
  });

  describe("Book Create Routes", () => {
    let author;
    let genre;

    beforeEach(async () => {
      author = await Author.create({
        first_name: "Test",
        family_name: "Author",
        date_of_birth: "1970-01-01",
      });

      genre = await Genre.create({ name: "Test Genre" });
    });

    it("should load the book create form", async () => {
      const res = await request(app).get("/catalog/book/create").expect(200);

      expect(res.text).to.include("Create Book");
    });

    it("should create a new book and redirect to book detail page", async () => {
      const bookData = {
        title: "Test Book",
        author: author._id.toString(),
        summary: "Summary here",
        isbn: "1234567890",
        genre: [genre._id.toString()],
      };

      const res = await request(app)
        .post("/catalog/book/create")
        .type("form")
        .send(bookData)
        .expect(302);

      expect(res.headers.location).to.match(
        /\/catalog\/book\/[a-fA-F0-9]{24}$/
      );

      const bookId = res.headers.location.split("/").pop();
      const book = await Book.findById(bookId);

      expect(book).to.exist;
      expect(book.title).to.equal(bookData.title);
    });

    it("should re-render form with errors if required fields are missing", async () => {
      const bookData = {
        title: "",
        author: author._id.toString(), // If empty string crashes.
        summary: "",
        isbn: "",
        genre: [],
      };

      const res = await request(app)
        .post("/catalog/book/create")
        .type("form")
        .send(bookData)
        .expect(200);

      expect(res.text).to.include("Create Book");
      expect(res.text).to.include("must not be empty");
    });
  });

  describe("Book Update Routes", () => {
    let author, genre, book;

    beforeEach(async () => {
      author = await Author.create({
        first_name: "Book",
        family_name: "Writer",
        date_of_birth: "1960-01-01",
      });

      genre = await Genre.create({ name: "Fiction" });

      book = await Book.create({
        title: "Original Title",
        author: author._id,
        summary: "Original summary",
        isbn: "1234567890",
        genre: [genre._id],
      });
    });

    it("should render the book update form", async () => {
      const res = await request(app)
        .get(`/catalog/book/${book._id}/update`)
        .expect(200);

      expect(res.text).to.include("Update Book");
      expect(res.text).to.include("Original Title");
      expect(res.text).to.include("Original summary");
    });

    it("should update the book and redirect to detail page", async () => {
      const res = await request(app)
        .post(`/catalog/book/${book._id}/update`)
        .type("form")
        .send({
          title: "Updated Title",
          author: author._id.toString(),
          summary: "Updated summary",
          isbn: "9876543210",
          genre: [genre._id.toString()],
          bookid: book._id.toString(),
        })
        .expect(302);

      expect(res.headers.location).to.equal(`/catalog/book/${book._id}`);

      const updated = await Book.findById(book._id);
      expect(updated.title).to.equal("Updated Title");
      expect(updated.summary).to.equal("Updated summary");
      expect(updated.isbn).to.equal("9876543210");
    });

    it("should re-render form with errors if required fields are missing", async () => {
      const res = await request(app)
        .post(`/catalog/book/${book._id}/update`)
        .type("form")
        .send({
          title: "", // Required
          author: author._id.toString(), // Required
          summary: "",
          isbn: "",
          genre: [genre._id.toString()],
          bookid: book._id.toString(),
        })
        .expect(200); // Should re-render form, not redirect

      expect(res.text).to.include("Update Book");
      expect(res.text).to.include("Title must not be empty");
      //expect(res.text).to.include("Author must not be empty");
    });
  });
});
