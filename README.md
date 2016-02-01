# Notman Platform API

Welcome to the Notman HTTP API.

This is a Node.js + Express server that serves as the backend for API services
for the [Notman House](http://notman.org/).

Currently, it provides these services:

- Events API for the events dashboard


## Running the server locally

Install the dependencies.

`npm install`

Then, run the dev server.

`npm run dev`

`nodemon` to watch for file changes and restart the
the server automatically.

To run the server on production:

`npm start`

## Setting environment variables

Environment variables are used to provide sensitive configuration values (such as credentials) to the server.

If a `.env` file is present, it will be loaded automatically by the `dotenv` module.

The following environment variables are required to run the server:

- `GOOGLE_CALENDAR_ID`
- `GOOGLE_API_KEY`

## Running tests

Tests are in the `test` directory.

To run tests:

`npm test`
