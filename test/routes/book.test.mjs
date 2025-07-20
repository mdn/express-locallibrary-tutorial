// test/routes/catalog.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

// Import the Express app
import app from "../../app.js";

// Set up test database
import testDB from "../utils/test_db.mjs";

// Import models used in tests
import Genre from "../../models/genre.js";
import Author from "../../models/author.js";
import Book from "../../models/book.js";
import BookInstance from "../../models/bookinstance.js";

// Top-level suite for all Book Routes tests
test("Book Routes", async (t) => {
  // Connect to the test database before running all tests in this suite
  t.before(async () => {
    await testDB.connect();
  });

  // Close the test database connection after all tests in this suite
  t.after(async () => {
    await testDB.close();
  });

  // Clear the test database before each nested test
  t.beforeEach(async () => {
    await testDB.clearDatabase();
  });

  // Book List Routes Suite
  await t.test("Book List Routes", async (t) => {
    await t.test("GET /catalog/books", async () => {
      const res = await request(app).get("/catalog/books").expect(200);
      assert.ok(
        res.text.toLowerCase().includes("book"),
        `Expected "book" in response, got: ${res.text}`
      );
    });
  });

  // Book Detail Routes Suite
  await t.test("Book Detail Routes", async (t) => {
    await t.test(
      "should return book detail page for existing book",
      async () => {
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

        assert.ok(
          res.text.includes("Happy"),
          `Expected "Happy" in response, got: ${res.text}`
        );
        assert.ok(
          res.text.includes("Jones"),
          `Expected "Jones" in response, got: ${res.text}`
        );
        assert.ok(
          res.text.includes("Fan Fiction"),
          `Expected "Fan Fiction" in response, got: ${res.text}`
        );
      }
    );

    await t.test("should return 404 for non-existent book", async () => {
      const fakeId = "64f1e0aa6a429f0f8d0d0d0d"; // valid but not in DB
      await request(app).get(`/catalog/book/${fakeId}`).expect(404);
    });
  });

  // Book Delete Routes Suite
  await t.test("Book Delete Routes", async (t) => {
    let book;

    t.beforeEach(async () => {
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

    await t.test("should load the book delete confirmation page", async () => {
      const res = await request(app)
        .get(`/catalog/book/${book._id}/delete`)
        .expect(200);

      assert.ok(
        res.text.includes("Delete Book"),
        `Expected "Delete Book", got: ${res.text}`
      );
      assert.ok(
        res.text.includes("Delete Me"),
        `Expected "Delete Me", got: ${res.text}`
      );
    });

    await t.test(
      "should delete the book and redirect to book list",
      async () => {
        const res = await request(app)
          .post(`/catalog/book/${book._id}/delete`)
          .type("form") // Simulates form POST
          .send({ id: book._id.toString() }) // This is where server gets the ID
          .expect(302);

        assert.strictEqual(
          res.headers.location,
          "/catalog/books",
          `Expected redirect to /catalog/books, got: ${res.headers.location}`
        );

        // Confirm it's deleted
        const found = await Book.findById(book._id);
        assert.strictEqual(
          found,
          null,
          `Expected book to be null after deletion, but found: ${found}`
        );
      }
    );

    await t.test(
      "should NOT delete the Book if BookInstances exist",
      async () => {
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
        assert.notStrictEqual(
          found,
          null,
          `Expected book to NOT be null, but was: ${found}`
        );

        assert.ok(
          res.text.includes("Delete Book"),
          `Expected "Delete Book", got: ${res.text}`
        );
        assert.ok(
          res.text.includes("Library Copy 1"),
          `Expected "Library Copy 1", got: ${res.text}`
        );
      }
    );
  });

  // Book Create Routes Suite
  await t.test("Book Create Routes", async (t) => {
    let author;
    let genre;

    t.beforeEach(async () => {
      author = await Author.create({
        first_name: "Test",
        family_name: "Author",
        date_of_birth: "1970-01-01",
      });

      genre = await Genre.create({ name: "Test Genre" });
    });

    await t.test("should load the book create form", async () => {
      const res = await request(app).get("/catalog/book/create").expect(200);
      assert.ok(
        res.text.includes("Create Book"),
        `Expected "Create Book", got: ${res.text}`
      );
    });

    await t.test(
      "should create a new book and redirect to book detail page",
      async () => {
        const bookData = {
          title: "Test Book",
          author: author._id.toString(),
          summary: "Summary here",
          isbn: "1234567890",
          // Ensure genre is sent as an array of strings
          genre: [genre._id.toString()],
        };

        const res = await request(app)
          .post("/catalog/book/create")
          .type("form")
          .send(bookData)
          .expect(302);

        assert.match(
          res.headers.location,
          /\/catalog\/book\/[a-fA-F0-9]{24}$/,
          `Expected redirect to book detail, got: ${res.headers.location}`
        );

        const bookId = res.headers.location.split("/").pop();
        const book = await Book.findById(bookId);

        assert.notStrictEqual(
          book,
          null,
          `Expected book to exist, but was null`
        );
        assert.strictEqual(
          book.title,
          bookData.title,
          `Expected book title to be "${bookData.title}", got: ${book.title}`
        );
      }
    );

    await t.test(
      "should re-render form with errors if required fields are missing",
      async () => {
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

        assert.ok(
          res.text.includes("Create Book"),
          `Expected "Create Book", got: ${res.text}`
        );
        assert.ok(
          res.text.includes("Title must not be empty"),
          `Expected "Title must not be empty", got: ${res.text}`
        );
        assert.ok(
          res.text.includes("ISBN must not be empty"),
          `Expected "ISBN must not be empty", got: ${res.text}`
        );
      }
    );
  });

  // Book Update Routes Suite
  await t.test("Book Update Routes", async (t) => {
    let author, genre, book;

    t.beforeEach(async () => {
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

    await t.test("should render the book update form", async () => {
      const res = await request(app)
        .get(`/catalog/book/${book._id}/update`)
        .expect(200);

      assert.ok(
        res.text.includes("Update Book"),
        `Expected "Update Book", got: ${res.text}`
      );
      assert.ok(
        res.text.includes("Original Title"),
        `Expected "Original Title", got: ${res.text}`
      );
      assert.ok(
        res.text.includes("Original summary"),
        `Expected "Original summary", got: ${res.text}`
      );
    });

    await t.test(
      "should update the book and redirect to detail page",
      async () => {
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

        assert.strictEqual(
          res.headers.location,
          `/catalog/book/${book._id}`,
          `Expected redirect to book detail, got: ${res.headers.location}`
        );

        const updated = await Book.findById(book._id);
        assert.strictEqual(
          updated.title,
          "Updated Title",
          `Expected updated title to be "Updated Title", got: ${updated.title}`
        );
        assert.strictEqual(
          updated.summary,
          "Updated summary",
          `Expected updated summary to be "Updated summary", got: ${updated.summary}`
        );
        assert.strictEqual(
          updated.isbn,
          "9876543210",
          `Expected updated ISBN to be "9876543210", got: ${updated.isbn}`
        );
      }
    );

    await t.test(
      "should re-render form with errors if required fields are missing",
      async () => {
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

        assert.ok(
          res.text.includes("Update Book"),
          `Expected "Update Book", got: ${res.text}`
        );
        assert.ok(
          res.text.includes("Title must not be empty"),
          `Expected "Title must not be empty", got: ${res.text}`
        );
        assert.ok(
          res.text.includes("ISBN must not be empty"),
          `Expected "ISBN must not be empty", got: ${res.text}`
        );
      }
    );
  });
});
