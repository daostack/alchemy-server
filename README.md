# Alchemy Server

## Dependencies:
* [NVM](https://github.com/creationix/nvm#installation) can be helpful for managing Node versions locally
* [NodeJS 9.4+ and NPM](https://github.com/creationix/nvm#usage)
* [PostgreSQL](https://www.postgresql.org/download/)
* [Alchemy Client](https://github.com/daostack/alchemy)

## Installation
* Setup PostgreSQL with a database called `alchemy`, and a user named `alchemist` with a password of `njksdfyuieyui34y`
* `npm install`
* `node ./server/create-lb-tables.js`
* `node ./server/migrate.js`

# Run app locally
* `npm run start`
* Start up the Alchemy Client app

# Development

## Migrations

After changing any model definition (.json) files, run: `node ./server/migrate.js`
