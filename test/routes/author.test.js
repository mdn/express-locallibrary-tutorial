// test/routes/author.test.js

const request = require("supertest"); // For testing HTTP endpoints
const { expect } = require("chai"); // For assertions (use 'expect' style)

// Import the Express app
const app = require("../../app");

// Set up test database
const testDB = require("../utils/test_db");

// Import models used in Author route tests
const Genre = require("../../models/genre");
const Author = require("../../models/author");
const Book = require("../../models/book");

describe("Author Routes", () => {
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

  describe("Author List Routes", () => {
    describe("GET /catalog/authors", () => {
      it("should return 200 and contain 'Author List' or similar text", async () => {
        console.log("OK at this point?");
        const res = await request(app).get("/catalog/authors").expect(200);
        console.log("2OK at this point?");
        // Adjust this check to your actual HTML output
        expect(res.text.toLowerCase()).to.include("author list");
        console.log("3OK at this point?");
      });
    });
  });

  describe("Author Detail Routes", () => {
    it("should return author detail page for existing author", async () => {
      // Create a test author
      const author = new Author({
        first_name: "Nasir ",
        family_name: "Farooq",
        date_of_birth: new Date("1920-01-02"),
        date_of_death: new Date("1992-04-06"),
      });

      await author.save();

      const res = await request(app)
        .get(`/catalog/author/${author._id}`)
        .expect(200);

      // You can check for either full name or family name depending on how it's rendered
      expect(res.text).to.include("Farooq");
      expect(res.text).to.include("Nasir");
    });

    it("should return 404 for non-existent author", async () => {
      const fakeId = "64f1e0aa6a429f0f8d0d0d0d"; // valid ObjectId, doesn't exist
      await request(app).get(`/catalog/author/${fakeId}`).expect(404);
    });
  });

  describe("Author Delete Routes", () => {
    let author;

    beforeEach(async () => {
      author = await Author.create({
        first_name: "Deletable",
        family_name: "Author",
        date_of_birth: "1970-01-01",
      });
    });

    it("should load the author delete confirmation page", async () => {
      const res = await request(app)
        .get(`/catalog/author/${author._id}/delete`)
        .expect(200);

      expect(res.text).to.include("Delete Author");
      expect(res.text).to.include("Deletable");
    });

    it("should delete the author and redirect to author list", async () => {
      const res = await request(app)
        .post(`/catalog/author/${author._id}/delete`)
        .type("form")
        .send({ authorid: author._id.toString() }) // Form body
        .expect(302);

      expect(res.headers.location).to.equal("/catalog/authors");

      const found = await Author.findById(author._id);
      expect(found).to.be.null;
    });

    it("should NOT delete the author if books exist", async () => {
      const genre = await Genre.create({ name: "Drama" });

      await Book.create({
        title: "Bound to Author",
        author: author._id,
        summary: "A book written by the author",
        isbn: "1111111111",
        genre: [genre._id],
      });

      const res = await request(app)
        .post(`/catalog/author/${author._id}/delete`)
        .type("form")
        .send({ id: author._id.toString() })
        .expect(200); // Should NOT redirect

      const found = await Author.findById(author._id);
      expect(found).to.not.be.null;

      expect(res.text).to.include("Delete Author");
      expect(res.text).to.include("Bound to Author");
    });
  });

  describe("Author Create Routes", () => {
    it("should load the author create form", async () => {
      const res = await request(app).get("/catalog/author/create").expect(200);

      expect(res.text).to.include("Create Author");
    });

    it("should create a new author and redirect to author detail page", async () => {
      const authorData = {
        first_name: "Test",
        family_name: "Author",
        date_of_birth: "1970-01-01",
        date_of_death: "2020-12-31",
      };

      const res = await request(app)
        .post("/catalog/author/create")
        .type("form")
        .send(authorData)
        .expect(302);

      // Redirects to the detail page of the newly created author
      expect(res.headers.location).to.match(
        /\/catalog\/author\/[a-fA-F0-9]{24}$/
      );

      const authorId = res.headers.location.split("/").pop();
      const author = await Author.findById(authorId);

      expect(author).to.exist;
      expect(author.first_name).to.equal(authorData.first_name);
      expect(author.family_name).to.equal(authorData.family_name);
    });

    it("should re-render the form with errors if required fields are missing", async () => {
      const res = await request(app)
        .post("/catalog/author/create")
        .type("form")
        .send({ first_name: "", family_name: "" }) // Missing required fields
        .expect(200);

      expect(res.text).to.include("Create Author");
      expect(res.text).to.include("First name must be specified"); //
      expect(res.text).to.include("Family name must be specified");
      // We could also test on: First name has non-alphanumeric characters.
      // We could also test on: Family name has non-alphanumeric characters.
    });
  });

  describe("Author Update Routes", () => {
    let author;

    beforeEach(async () => {
      author = await Author.create({
        first_name: "UpdateMe",
        family_name: "Writer",
        date_of_birth: "1970-01-01",
      });
    });

    it("should render the author update form", async () => {
      const res = await request(app)
        .get(`/catalog/author/${author._id}/update`)
        .expect(200);

      expect(res.text).to.include("Update Author");
      expect(res.text).to.include("UpdateMe");
      expect(res.text).to.include("Writer");
    });

    it("should update the author and redirect to detail page", async () => {
      const res = await request(app)
        .post(`/catalog/author/${author._id}/update`)
        .type("form")
        .send({
          first_name: "Updated",
          family_name: "Author",
          date_of_birth: "1960-05-15",
          date_of_death: "2020-01-01",
          authorid: author._id.toString(), // This is used in controller logic
        })
        .expect(302);

      expect(res.headers.location).to.equal(`/catalog/author/${author._id}`);

      const updated = await Author.findById(author._id);
      expect(updated.first_name).to.equal("Updated");
      expect(updated.family_name).to.equal("Author");
    });

    it("should re-render the form with errors if required fields are missing", async () => {
      const res = await request(app)
        .post(`/catalog/author/${author._id}/update`)
        .type("form")
        .send({
          first_name: "", // Missing required
          family_name: "",
          date_of_birth: "1970-01-01",
          date_of_death: "2020-01-01",
          authorid: author._id.toString(),
        })
        .expect(200); // Should not redirect

      expect(res.text).to.include("Update Author");
      expect(res.text).to.include("First name must be specified");
      expect(res.text).to.include("Family name must be specified");
    });
  });
});
