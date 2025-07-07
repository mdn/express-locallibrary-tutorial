// test/routes/catalog.test.js

const request = require("supertest"); // For testing HTTP endpoints
const { expect } = require("chai"); // For assertions (use 'expect' style)

// Import the Express app and create it.
const { createApp } = require("../../app");
const app = createApp();

// Set up test database
const testDB = require("../utils/test_db");

describe("Catalog Routes", () => {
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

  describe("Catalog List Routes", () => {
    describe("GET /catalog", () => {
      it("should return 200 and contain 'Local Library Home'", async () => {
        const res = await request(app).get("/catalog").expect(200);
        expect(res.text).to.include("Local Library Home");
      });
    });

    // Test a 404
    describe("GET /catalog/unknown", () => {
      it("should return 404 for non-existent subroute", async () => {
        await request(app).get("/catalog/unknown").expect(404);
      });
    });
  });
});
