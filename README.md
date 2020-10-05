# express-locallibrary-tutorial
Tutorial "Local Library" website written in in Node/Express.

----

This web application creates an online catalog for a small local library, where users can browse available books and manage their accounts.

![](https://github.com/mdn/express-locallibrary-tutorial/blob/master/public/images/Library%20Website%20-%20Mongoose_Express.png)


For more information see the associated [MDN tutorial home page](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website).


> **Note** The [auth branch](/../../tree/auth) in this repository implements an *unsupported* and *undocumented* version of the library with User Authentication and Authorization. This may be a useful starting point for some users.


## Quick Start

To get this project up and running locally on your computer:

1. Set up a [Nodejs](https://wiki.developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/development_environment) development environment.
1. Once you have node setup, enter the following commands in the root of your clone of this repo:
   ```
   npm install
   DEBUG=express-locallibrary-tutorial:* npm run devstart   #For linux
   ```
1. Open a browser to http://localhost:3000/ to open the library site.

> **Note:** The library uses a default MongoDb database hosted on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). You should use a different database for your own code experiments.
