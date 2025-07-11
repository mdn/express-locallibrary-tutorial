// test/routes/author.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

// Import the Express app
import app from "../../app.js";

// Set up test database
import testDB from "../utils/test_db.mjs";

// Import models used in Author route tests
import Genre from "../../models/genre.js";
import Author from "../../models/author.js";
import Book from "../../models/book.js";

// Top-level suite for all Author Routes tests
test("Author Routes", async (t) => {
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

  // Author List Routes Suite
  await t.test("Author List Routes", async (t) => {
    await t.test("GET /catalog/authors", async () => {
      const res = await request(app).get("/catalog/authors").expect(200);

      assert.ok(
        res.text.toLowerCase().includes("author list"),
        `Expected "author list" in response, got: ${res.text}`
      );
    });
  });

  // Author Detail Routes Suite
  await t.test("Author Detail Routes", async (t) => {
    await t.test(
      "should return author detail page for existing author",
      async () => {
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

        assert.ok(
          res.text.includes("Farooq"),
          `Expected "Farooq" in response, got: ${res.text}`
        );
        assert.ok(
          res.text.includes("Nasir"),
          `Expected "Nasir" in response, got: ${res.text}`
        );
      }
    );

    await t.test("should return 404 for non-existent author", async () => {
      const fakeId = "64f1e0aa6a429f0f8d0d0d0d"; // valid ObjectId, doesn't exist
      await request(app).get(`/catalog/author/${fakeId}`).expect(404);
    });
  });

  // Author Delete Routes Suite
  await t.test("Author Delete Routes", async (t) => {
    let author;

    t.beforeEach(async () => {
      // Author for delete tests
      author = await Author.create({
        first_name: "Deletable",
        family_name: "Author",
        date_of_birth: "1970-01-01",
      });
    });

    await t.test(
      "should load the author delete confirmation page",
      async () => {
        const res = await request(app)
          .get(`/catalog/author/${author._id}/delete`)
          .expect(200);

        assert.ok(
          res.text.includes("Delete Author"),
          `Expected "Delete Author", got: ${res.text}`
        );
        assert.ok(
          res.text.includes("Deletable"),
          `Expected "Deletable", got: ${res.text}`
        );
      }
    );

    await t.test(
      "should delete the author and redirect to author list",
      async () => {
        const res = await request(app)
          .post(`/catalog/author/${author._id}/delete`)
          .type("form")
          .send({ authorid: author._id.toString() }) // Form body
          .expect(302);

        assert.strictEqual(
          res.headers.location,
          "/catalog/authors",
          `Expected redirect to /catalog/authors, got: ${res.headers.location}`
        );

        const found = await Author.findById(author._id);
        assert.strictEqual(
          found,
          null,
          `Expected author to be null after deletion, but found: ${found}`
        );
      }
    );

    await t.test("should NOT delete the author if books exist", async () => {
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
        .send({ id: author._id.toString() }) // Note: Was `id`, but controller likely expects `authorid` for consistency
        .expect(200); // Should NOT redirect

      const found = await Author.findById(author._id);
      assert.notStrictEqual(
        found,
        null,
        `Expected author to NOT be null, but was: ${found}`
      );

      assert.ok(
        res.text.includes("Delete Author"),
        `Expected "Delete Author", got: ${res.text}`
      );
      assert.ok(
        res.text.includes("Bound to Author"),
        `Expected "Bound to Author", got: ${res.text}`
      );
    });
  });

  // Author Create Routes Suite
  await t.test("Author Create Routes", async (t) => {
    await t.test("should load the author create form", async () => {
      const res = await request(app).get("/catalog/author/create").expect(200);
      assert.ok(
        res.text.includes("Create Author"),
        `Expected "Create Author", got: ${res.text}`
      );
    });

    await t.test(
      "should create a new author and redirect to author detail page",
      async () => {
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

        assert.match(
          res.headers.location,
          /\/catalog\/author\/[a-fA-F0-9]{24}$/,
          `Expected redirect to author detail, got: ${res.headers.location}`
        );

        const authorId = res.headers.location.split("/").pop();
        const author = await Author.findById(authorId);

        assert.notStrictEqual(
          author,
          null,
          `Expected author to exist, but was null`
        );
        assert.strictEqual(
          author.first_name,
          authorData.first_name,
          `Expected first name to be "${authorData.first_name}", got: ${author.first_name}`
        );
        assert.strictEqual(
          author.family_name,
          authorData.family_name,
          `Expected family name to be "${authorData.family_name}", got: ${author.family_name}`
        );
      }
    );

    await t.test(
      "should re-render the form with errors if required fields are missing",
      async () => {
        const res = await request(app)
          .post("/catalog/author/create")
          .type("form")
          .send({ first_name: "", family_name: "" }) // Missing required fields
          .expect(200);

        assert.ok(
          res.text.includes("Create Author"),
          `Expected "Create Author", got: ${res.text}`
        );
        assert.ok(
          res.text.includes("First name must be specified"),
          `Expected "First name must be specified", got: ${res.text}`
        );
        assert.ok(
          res.text.includes("Family name must be specified"),
          `Expected "Family name must be specified", got: ${res.text}`
        );
      }
    );
  });

  // Author Update Routes Suite
  await t.test("Author Update Routes", async (t) => {
    let author;

    t.beforeEach(async () => {
      // Author for update tests
      author = await Author.create({
        first_name: "UpdateMe",
        family_name: "Writer",
        date_of_birth: "1970-01-01",
      });
    });

    await t.test("should render the author update form", async () => {
      const res = await request(app)
        .get(`/catalog/author/${author._id}/update`)
        .expect(200);

      assert.ok(
        res.text.includes("Update Author"),
        `Expected "Update Author", got: ${res.text}`
      );
      assert.ok(
        res.text.includes("UpdateMe"),
        `Expected "UpdateMe", got: ${res.text}`
      );
      assert.ok(
        res.text.includes("Writer"),
        `Expected "Writer", got: ${res.text}`
      );
    });

    await t.test(
      "should update the author and redirect to detail page",
      async () => {
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

        assert.strictEqual(
          res.headers.location,
          `/catalog/author/${author._id}`,
          `Expected redirect to author detail, got: ${res.headers.location}`
        );

        const updated = await Author.findById(author._id);
        assert.strictEqual(
          updated.first_name,
          "Updated",
          `Expected updated first name to be "Updated", got: ${updated.first_name}`
        );
        assert.strictEqual(
          updated.family_name,
          "Author",
          `Expected updated family name to be "Author", got: ${updated.family_name}`
        );
      }
    );

    await t.test(
      "should re-render the form with errors if required fields are missing",
      async () => {
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

        assert.ok(
          res.text.includes("Update Author"),
          `Expected "Update Author", got: ${res.text}`
        );
        assert.ok(
          res.text.includes("First name must be specified"),
          `Expected "First name must be specified", got: ${res.text}`
        );
        assert.ok(
          res.text.includes("Family name must be specified"),
          `Expected "Family name must be specified", got: ${res.text}`
        );
      }
    );
  });
});
