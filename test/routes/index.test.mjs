// test/routes/index.test.mjs

import { test } from "node:test"; // Only import 'test' now
import assert from "node:assert/strict"; // Using strict assertions

import request from "supertest";

// Import the Express app
import app from "../../app.js";

// Ensure index routes are tested
test("Index Routes", async (t) => {
  // 't' is the TestContext - passed for nested tests (Use t.test() for nesting)
  await t.test("GET /", async (t) => {
    await t.test(
      "should return 302 Found and redirect to catalog",
      async () => {
        const res = await request(app).get("/").expect(302);

        assert.ok(
          res.text.includes("Redirecting to /catalog"),
          `Expected response text to include "Redirecting to /catalog" but got: ${res.text}`
        );
      }
    );
  });
});
