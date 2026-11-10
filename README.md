# express-locallibrary-tutorial

Tutorial "Local Library" website written in Node/Express.

---

This web application creates an online catalog for a small local library, where users can browse available books and manage their accounts.

![A UML diagram showing the relation of database entities in this example repository](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/mongoose/library_website_-_mongoose_express.png)

For more information see the associated [MDN tutorial home page](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/Tutorial_local_library_website).

> **Note** The [auth branch](/../../tree/auth) in this repository implements an _unsupported_ and _undocumented_ version of the library with User Authentication and Authorization. This may be a useful starting point for some users.

## Try it without a database

If you just want to see the finished site, you don't need to set up MongoDB.
Install [Node.js](https://nodejs.org/en/download) 24 or later, clone this repo, and run these commands in its root:

```bash
npm install
npm run demo
```

Then open <http://localhost:3000/>.
The demo starts a temporary in-memory database and fills it with sample books, authors, genres and book copies.
Any changes you make are lost when you stop the server with <kbd>Ctrl</kbd>+<kbd>C</kbd>.
The first run downloads a MongoDB binary, so it may take a minute.

## Quick Start

To set the project up for development, with a database that keeps your data:

1. Set up a [Node.js](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/development_environment) development environment (Node.js 24 or later).
2. Make a MongoDB database available.
   By default the app connects to a local MongoDB server at `mongodb://127.0.0.1:27017/local_library`.
   You can:
   - [Install MongoDB Community Edition](https://www.mongodb.com/docs/manual/administration/install-community/) locally.
   - Run MongoDB in [Docker](https://docs.docker.com/get-started/get-docker/), keeping the data in a named volume:

     ```bash
     docker run -d --name locallibrary-mongo -p 127.0.0.1:27017:27017 -v locallibrary-data:/data/db mongo:8
     ```

   - Use a hosted database such as [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database), and set the `MONGODB_URI` environment variable to its connection string.
3. Once you have node setup install the project in the root of your clone of this repo:

   ```bash
   npm install
   ```

4. Optionally, add some sample books, authors, genres and book copies to the database:

   ```bash
   node populatedb.js "mongodb://127.0.0.1:27017/local_library"
   ```

5. Run the tutorial server, using the appropriate command line shell for your environment:

   ```bash
   # Linux or macOS terminal
   DEBUG=express-locallibrary-tutorial:* npm run devstart

   # Windows CMD
   SET DEBUG=express-locallibrary-tutorial:* & npm run devstart

   # Windows PowerShell
   $ENV:DEBUG = "express-locallibrary-tutorial:*"; npm run devstart
   ```

   The `devstart` script restarts the server when you change a JavaScript file.
   Use `npm start` instead to run the server without watching for changes.

6. Open a browser to <http://localhost:3000/> to open the library site.

## Contributing

The project is the result of carefully running through all the steps in the [tutorial on MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/Tutorial_local_library_website).
Any changes to either MDN or this project must be synchronized.
Generally it is better to implement changes here before submitting them to MDN.

Before submitting a PR, make sure that the tests pass:

```bash
npm test
```
