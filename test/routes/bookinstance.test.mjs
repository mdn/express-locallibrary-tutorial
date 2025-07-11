// test/routes/bookinstance.test.mjs

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

// Top-level suite for all BookInstance Routes tests
test("BookInstance Routes", async (t) => {
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

  // BookInstance List Routes Suite
  await t.test("BookInstance List Routes", async (t) => {
    await t.test("GET /catalog/bookinstances", async () => {
      const res = await request(app).get("/catalog/bookinstances").expect(200);

      assert.ok(
        res.text.toLowerCase().includes("book instance list"),
        `Expected "book instance list" in response, got: ${res.text}`
      );
    });
  });

  // BookInstance Detail Routes Suite
  await t.test("BookInstance Detail Routes", async (t) => {
    await t.test(
      "should return BookInstance detail page for existing instance",
      async () => {
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

        assert.ok(
          res.text.includes("Hitchhiker"),
          `Expected "Hitchhiker", got: ${res.text}`
        );
        assert.ok(
          res.text.includes("Available"),
          `Expected "Available", got: ${res.text}`
        );
        assert.ok(
          res.text.includes("42nd Printing"),
          `Expected "42nd Printing", got: ${res.text}`
        );
      }
    );

    await t.test(
      "should return 404 for non-existent BookInstance",
      async () => {
        const fakeId = "64f1e0aa6a429f0f8d0d0d0d"; // valid ObjectId format, doesn't exist
        await request(app).get(`/catalog/bookinstance/${fakeId}`).expect(404);
      }
    );
  });

  // BookInstance Delete Routes Suite
  await t.test("BookInstance Delete Routes", async (t) => {
    let bookInstance;
    let book; // Declare book at this scope for beforeEach

    t.beforeEach(async () => {
      // Create author and genre for the book
      const author = await Author.create({
        first_name: "Test",
        family_name: "Author",
        date_of_birth: "1970-01-01",
      });

      const genre = await Genre.create({ name: "Test Genre" });

      book = await Book.create({
        // Assign to outer scope 'book'
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

    await t.test(
      "should load the BookInstance delete confirmation page",
      async () => {
        const res = await request(app)
          .get(`/catalog/bookinstance/${bookInstance._id}/delete`)
          .expect(200);

        assert.ok(
          res.text.includes("Delete BookInstance"),
          `Expected "Delete BookInstance", got: ${res.text}`
        );
        assert.ok(
          res.text.includes("Library Copy 1"),
          `Expected "Library Copy 1", got: ${res.text}`
        );
      }
    );

    await t.test(
      "should delete the BookInstance and redirect to BookInstance list",
      async () => {
        const res = await request(app)
          .post(`/catalog/bookinstance/${bookInstance._id}/delete`)
          .type("form")
          .send({ id: bookInstance._id.toString() })
          .expect(302);

        assert.strictEqual(
          res.headers.location,
          "/catalog/bookinstances",
          `Expected redirect to /catalog/bookinstances, got: ${res.headers.location}`
        );

        const found = await BookInstance.findById(bookInstance._id);
        assert.strictEqual(
          found,
          null,
          `Expected BookInstance to be null after deletion, but found: ${found}`
        );
      }
    );
  });

  // BookInstance Create Routes Suite
  await t.test("BookInstance Create Routes", async (t) => {
    let book; // Declare book at this scope for beforeEach

    t.beforeEach(async () => {
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

    await t.test("should render the BookInstance creation form", async () => {
      const res = await request(app)
        .get("/catalog/bookinstance/create")
        .expect(200);

      assert.ok(
        res.text.includes("Create BookInstance"),
        `Expected "Create BookInstance", got: ${res.text}`
      );
      assert.ok(
        res.text.includes("Status"),
        `Expected "Status", got: ${res.text}`
      );
    });

    await t.test(
      "should create a new BookInstance and redirect to detail",
      async () => {
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

        assert.notStrictEqual(
          instance,
          null,
          `Expected instance to exist, but was null`
        );
        assert.strictEqual(
          res.headers.location,
          `/catalog/bookinstance/${instance._id}`,
          `Expected redirect to instance detail, got: ${res.headers.location}`
        );
      }
    );

    await t.test(
      "should re-render the form with errors if (most) required fields are missing",
      async () => {
        const res = await request(app)
          .post("/catalog/bookinstance/create")
          .type("form")
          .send({
            book: book._id.toString(), // Book ID is usually needed to populate the dropdown, even if other fields are missing
            imprint: "", // missing imprint
            status: "Available",
            due_back: "", // optional, but book and imprint are required
          })
          .expect(200);

        assert.ok(
          res.text.includes("Create BookInstance"),
          `Expected "Create BookInstance", got: ${res.text}`
        );
        assert.ok(
          res.text.includes("Imprint must be specified"),
          `Expected "Imprint must be specified", got: ${res.text}`
        );
      }
    );
  });

  // BookInstance Update Routes
  await t.test("BookInstance Update Routes", async (t) => {
    let author, genre, book, bookInstance; // Declare variables at this scope

    t.beforeEach(async () => {
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

    await t.test("should render the bookinstance update form", async () => {
      const res = await request(app)
        .get(`/catalog/bookinstance/${bookInstance._id}/update`)
        .expect(200);

      assert.ok(
        res.text.includes("Update BookInstance"),
        `Expected "Update BookInstance", got: ${res.text}`
      );
      assert.ok(
        res.text.includes("1st Edition"),
        `Expected "1st Edition", got: ${res.text}`
      );
    });

    await t.test(
      "should update the bookinstance and redirect to detail page",
      async () => {
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

        assert.strictEqual(
          res.headers.location,
          `/catalog/bookinstance/${bookInstance._id}`,
          `Expected redirect to instance detail, got: ${res.headers.location}`
        );

        const updated = await BookInstance.findById(bookInstance._id);
        assert.strictEqual(
          updated.imprint,
          "2nd Edition",
          `Expected updated imprint to be "2nd Edition", got: ${updated.imprint}`
        );
        assert.strictEqual(
          updated.status,
          "Loaned",
          `Expected updated status to be "Loaned", got: ${updated.status}`
        );
        // For dates, it's safer to compare string representations or specific parts
        assert.ok(
          updated.due_back.toISOString().startsWith("2026-01-15"),
          `Expected due_back to start with "2026-01-15", got: ${updated.due_back.toISOString()}`
        );
      }
    );

    await t.test(
      "should re-render form with errors if required fields are missing",
      async () => {
        const res = await request(app)
          .post(`/catalog/bookinstance/${bookInstance._id}/update`)
          .type("form")
          .send({
            book: book._id.toString(), // Required
            imprint: "", // Missing imprint
            status: "", // Missing status (though often optional or default)
            due_back: "",
            bookinstanceid: bookInstance._id.toString(),
          })
          .expect(200); // should re-render form

        assert.ok(
          res.text.includes("Update BookInstance"),
          `Expected "Update BookInstance", got: ${res.text}`
        );
        assert.ok(
          res.text.includes("Imprint must be specified"),
          `Expected "Imprint must be specified", got: ${res.text}`
        );
      }
    );
  });
});
