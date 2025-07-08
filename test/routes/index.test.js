// test/routes/index.test.js

const request = require("supertest"); // For testing HTTP endpoints
const { expect } = require("chai"); // For assertions (use 'expect' style)

// Import the Express app
const app = require("../../app");

describe("Index Routes", () => {
  // Block for the test suite for the root route '/'
  describe("GET /", () => {
    // Test case: Redirect to catalog for root path
    it("should return 302 Found and redirect to catalog", async () => {
      try {
        // Use Supertest (request) to make a GET request to the root path '/'
        const res = await request(app).get("/").expect(302); // Assert that the HTTP status code is 302 (Found)

        // Assert that the response body contains the expected redirect message
        expect(res.text).to.include("Redirecting to /catalog");
      } catch (err) {
        // Log test error.
        console.error("Test failed:", err);
        // Mocha catches errors during the request or assertion and fails test.
        throw err; // Re-throw the error to ensure Mocha marks the test as failed
      }
    });
  });
});
