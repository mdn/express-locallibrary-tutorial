// test/routes/genre.test.mjs

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

// Top-level suite for all Genre Routes tests
test("Genre Routes", async (t) => {
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

  // Genre List Route Suite
  await t.test("Genre List Route", async (t) => {
    await t.test("GET /catalog/genres", async () => {
      const res = await request(app).get("/catalog/genres").expect(200);
      assert.ok(
        res.text.toLowerCase().includes("genre list"),
        `Expected "genre list" in response, got: ${res.text}`
      );
    });
  });

  // Genre Detail Routes Suite
  await t.test("Genre Detail Routes", async (t) => {
    await t.test(
      "should return genre detail page for existing genre",
      async () => {
        // Create a test genre in the (test) database
        const genre = new Genre({ name: "Science Fiction" });
        await genre.save();

        const res = await request(app)
          .get(`/catalog/genre/${genre._id}`)
          .expect(200);
        assert.ok(
          res.text.includes("Science Fiction"),
          `Expected "Science Fiction" in response, got: ${res.text}`
        );
      }
    );

    await t.test("should return 404 for non-existent genre", async () => {
      const fakeId = "64f1e0aa6a429f0f8d0d0d0d"; // valid ObjectId format but not in DB
      await request(app).get(`/catalog/genre/${fakeId}`).expect(404);
    });
  });

  // Genre Delete Routes Suite
  await t.test("Genre Delete Routes", async (t) => {
    let genre;

    // Create a test genre before each test in this specific suite
    t.beforeEach(async () => {
      genre = await Genre.create({
        name: "Test Genre",
      });
    });

    await t.test("should load the genre delete confirmation page", async () => {
      const res = await request(app)
        .get(`/catalog/genre/${genre._id}/delete`)
        .expect(200);

      assert.ok(
        res.text.includes("Delete Genre"),
        `Expected "Delete Genre", got: ${res.text}`
      );
      assert.ok(
        res.text.includes("Test Genre"),
        `Expected "Test Genre", got: ${res.text}`
      );
    });

    await t.test(
      "should delete the genre and redirect to genre list",
      async () => {
        const res = await request(app)
          .post(`/catalog/genre/${genre._id}/delete`)
          .type("form")
          .send({ id: genre._id.toString() })
          .expect(302);

        assert.strictEqual(
          res.headers.location,
          "/catalog/genres",
          `Expected redirect to /catalog/genres, got: ${res.headers.location}`
        );

        const found = await Genre.findById(genre._id);
        assert.strictEqual(
          found,
          null,
          `Expected genre to be null after deletion, but found: ${found}`
        );
      }
    );

    await t.test("should NOT delete the genre if books use it", async () => {
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
        .expect(200); // Should NOT redirect, but render page with error

      const found = await Genre.findById(genre._id);
      assert.notStrictEqual(
        found,
        null,
        `Expected genre to NOT be null, but was: ${found}`
      ); // Use notStrictEqual for not null/undefined

      assert.ok(
        res.text.includes("Delete Genre"),
        `Expected "Delete Genre", got: ${res.text}`
      );
      assert.ok(
        res.text.includes("Book With Genre"),
        `Expected "Book With Genre", got: ${res.text}`
      );
    });
  });

  // Genre Create Routes Suite
  await t.test("Genre Create Routes", async (t) => {
    await t.test("should load the genre create form", async () => {
      const res = await request(app).get("/catalog/genre/create").expect(200);
      assert.ok(
        res.text.includes("Create Genre"),
        `Expected "Create Genre", got: ${res.text}`
      );
    });

    await t.test(
      "should create a new genre and redirect to genre list",
      async () => {
        const res = await request(app)
          .post("/catalog/genre/create")
          .type("form")
          .send({ name: "New Genre Test" }) // form field name: "name"
          .expect(302);

        // Using assert.match for regex comparison
        assert.match(
          res.headers.location,
          /\/catalog\/genre\/[a-fA-F0-9]{24}$/,
          `Expected redirect to genre detail, got: ${res.headers.location}`
        );

        // Confirm genre created in DB
        const genreId = res.headers.location.split("/").pop();
        const genre = await Genre.findById(genreId);

        assert.notStrictEqual(
          genre,
          null,
          `Expected genre to exist, but was null`
        ); // Check for existence
        assert.strictEqual(
          genre.name,
          "New Genre Test",
          `Expected genre name to be "New Genre Test", got: ${genre.name}`
        );
      }
    );

    await t.test(
      "should re-render form with errors if genre name is missing",
      async () => {
        const res = await request(app)
          .post("/catalog/genre/create")
          .type("form")
          .send({ name: "" }) // empty name triggers validation error
          .expect(200);

        assert.ok(
          res.text.includes("Create Genre"),
          `Expected "Create Genre", got: ${res.text}`
        );
        assert.ok(
          res.text.includes("Genre name must contain"),
          `Expected validation error message, got: ${res.text}`
        );
      }
    );
  });

  // Genre Update Routes Suite
  await t.test("Genre Update Routes", async (t) => {
    let genre;

    // Create a test genre to update before each test in this specific suite
    t.beforeEach(async () => {
      genre = await Genre.create({ name: "Original Genre" });
    });

    await t.test("should load the genre update form", async () => {
      const res = await request(app)
        .get(`/catalog/genre/${genre._id}/update`)
        .expect(200);

      assert.ok(
        res.text.includes("Update Genre"),
        `Expected "Update Genre", got: ${res.text}`
      );
      assert.ok(
        res.text.includes("Original Genre"),
        `Expected "Original Genre", got: ${res.text}`
      );
    });

    await t.test(
      "should update the genre and redirect to detail page",
      async () => {
        const res = await request(app)
          .post(`/catalog/genre/${genre._id}/update`)
          .type("form")
          .send({
            name: "Updated Genre Name",
            id: genre._id.toString(), // Required by controller
          })
          .expect(302);

        assert.strictEqual(
          res.headers.location,
          `/catalog/genre/${genre._id}`,
          `Expected redirect to genre detail, got: ${res.headers.location}`
        );

        const updated = await Genre.findById(genre._id);
        assert.strictEqual(
          updated.name,
          "Updated Genre Name",
          `Expected updated name to be "Updated Genre Name", got: ${updated.name}`
        );
      }
    );

    await t.test(
      "should re-render the form with errors if name is missing",
      async () => {
        const res = await request(app)
          .post(`/catalog/genre/${genre._id}/update`)
          .type("form")
          .send({
            name: "", // Missing required field
            id: genre._id.toString(),
          })
          .expect(200);

        assert.ok(
          res.text.includes("Update Genre"),
          `Expected "Update Genre", got: ${res.text}`
        );
        assert.ok(
          res.text.includes("Genre name must contain at least 3 characters"),
          `Expected validation error, got: ${res.text}`
        );
      }
    );
  });
});
