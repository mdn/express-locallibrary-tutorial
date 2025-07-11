// test/routes/catalog.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

// Import the Express app
import app from "../../app.js";

// Set up test database
import testDB from "../utils/test_db.mjs";

// Top-level suite for all Catalog Routes tests
test("Catalog Routes", async (t) => {
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

  // Catalog List Routes Suite
  await t.test("Catalog List Routes", async (t) => {
    await t.test("GET /catalog", async () => {
      const res = await request(app).get("/catalog").expect(200);
      assert.ok(
        res.text.includes("Local Library Home"),
        `Expected "Local Library Home", got: ${res.text}`
      );
    });

    // Test a 404
    await t.test("GET /catalog/unknown", async () => {
      await request(app).get("/catalog/unknown").expect(404);
    });
  });
});
