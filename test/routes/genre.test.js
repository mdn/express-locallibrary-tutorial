// test/routes/genre.test.js

const request = require("supertest"); // For testing HTTP endpoints
const { expect } = require("chai"); // For assertions (use 'expect' style)

// Import the Express app and create it.
const { createApp } = require("../../app");
const app = createApp();

// Set up test database
const testDB = require("../utils/test_db");

// Import models used in Genre route tests
const Genre = require("../../models/genre");
const Author = require("../../models/author");
const Book = require("../../models/book");

describe("Genre Routes", () => {
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

  describe("Genre List Route", () => {
    describe("GET /catalog/genres", () => {
      it("should return 200 and contain 'Genre List' or similar text", async () => {
        const res = await request(app).get("/catalog/genres").expect(200);
        expect(res.text.toLowerCase()).to.include("genre list");
      });
    });
  });

  describe("Genre Detail Routes", () => {
    it("should return genre detail page for existing genre", async () => {
      // Create a test genre in the (test) database
      const genre = new Genre({ name: "Science Fiction" });
      await genre.save();

      const res = await request(app)
        .get(`/catalog/genre/${genre._id}`)
        .expect(200);
      expect(res.text).to.include("Science Fiction");
    });

    it("should return 404 for non-existent genre", async () => {
      const fakeId = "64f1e0aa6a429f0f8d0d0d0d"; // valid ObjectId format but not in DB
      await request(app).get(`/catalog/genre/${fakeId}`).expect(404);
    });
  });

  describe("Genre Delete Routes", () => {
    let genre;

    // Create a test genre before each test
    beforeEach(async () => {
      genre = await Genre.create({
        name: "Test Genre",
      });
    });

    it("should load the genre delete confirmation page", async () => {
      const res = await request(app)
        .get(`/catalog/genre/${genre._id}/delete`)
        .expect(200);

      expect(res.text).to.include("Delete Genre");
      expect(res.text).to.include("Test Genre");
    });

    it("should delete the genre and redirect to genre list", async () => {
      const res = await request(app)
        .post(`/catalog/genre/${genre._id}/delete`)
        .type("form")
        .send({ id: genre._id.toString() })
        .expect(302);

      expect(res.headers.location).to.equal("/catalog/genres");

      const found = await Genre.findById(genre._id);
      expect(found).to.be.null;
    });

    it("should NOT delete the genre if books use it", async () => {
      const author = await Author.create({
        first_name: "GenreLinked",
        family_name: "Author",
        date_of_birth: "1970-01-01",
      });

      await Book.create({
        title: "Book With Genre",
        author: author._id,
        summary: "Book linked to genre",
        isbn: "2222222222",
        genre: [genre._id],
      });

      const res = await request(app)
        .post(`/catalog/genre/${genre._id}/delete`)
        .type("form")
        .send({ id: genre._id.toString() })
        .expect(200); // Should NOT redirect

      const found = await Genre.findById(genre._id);
      expect(found).to.not.be.null;

      expect(res.text).to.include("Delete Genre");
      expect(res.text).to.include("Book With Genre");
    });
  });

  describe("Genre Create Routes", () => {
    it("should load the genre create form", async () => {
      const res = await request(app).get("/catalog/genre/create").expect(200);

      expect(res.text).to.include("Create Genre");
    });

    it("should create a new genre and redirect to genre list", async () => {
      const res = await request(app)
        .post("/catalog/genre/create")
        .type("form")
        .send({ name: "New Genre Test" }) // form field name: "name"
        .expect(302);

      expect(res.headers.location).to.match(
        /\/catalog\/genre\/[a-fA-F0-9]{24}$/
      );

      // Confirm genre created in DB
      const genreId = res.headers.location.split("/").pop();
      const genre = await Genre.findById(genreId);

      expect(genre).to.exist;
      expect(genre.name).to.equal("New Genre Test");
    });

    it("should re-render form with errors if genre name is missing", async () => {
      const res = await request(app)
        .post("/catalog/genre/create")
        .type("form")
        .send({ name: "" }) // empty name triggers validation error
        .expect(200);

      expect(res.text).to.include("Create Genre");
      expect(res.text).to.include("Genre name must contain");
    });
  });

  describe("Genre Update Routes", () => {
    let genre;

    // Create a test genre to update before each test
    beforeEach(async () => {
      genre = await Genre.create({ name: "Original Genre" });
    });

    it("should load the genre update form", async () => {
      const res = await request(app)
        .get(`/catalog/genre/${genre._id}/update`)
        .expect(200);

      expect(res.text).to.include("Update Genre");
      expect(res.text).to.include("Original Genre");
    });

    it("should update the genre and redirect to detail page", async () => {
      const res = await request(app)
        .post(`/catalog/genre/${genre._id}/update`)
        .type("form")
        .send({
          name: "Updated Genre Name",
          id: genre._id.toString(), // Required by controller
        })
        .expect(302);

      expect(res.headers.location).to.equal(`/catalog/genre/${genre._id}`);

      const updated = await Genre.findById(genre._id);
      expect(updated.name).to.equal("Updated Genre Name");
    });

    it("should re-render the form with errors if name is missing", async () => {
      const res = await request(app)
        .post(`/catalog/genre/${genre._id}/update`)
        .type("form")
        .send({
          name: "", // Missing required field
          id: genre._id.toString(),
        })
        .expect(200);

      expect(res.text).to.include("Update Genre");
      expect(res.text).to.include(
        "Genre name must contain at least 3 characters"
      );
    });
  });
});
