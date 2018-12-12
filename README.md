# Alchemy Server

## Dependencies:
* [NVM](https://github.com/creationix/nvm#installation) can be helpful for managing Node versions locally
* [NodeJS 9.4+ and NPM](https://github.com/creationix/nvm#usage)
* [PostgreSQL](https://www.postgresql.org/download/)
* [Alchemy Client](https://github.com/daostack/alchemy)

## Installation
* Setup PostgreSQL with a database called `alchemy`: `CREATE DATABASE alchemy;`
*   and a user named `alchemist` with a password of `njksdfyuieyui34y`: `CREATE ROLE alchemist with login password 'njksdfyuieyui34y'; GRANT ALL PRIVILEGES ON DATABASE alchemy TO alchemist;`
* `npm install`
* `node ./server/create-lb-tables.js`
* `node ./server/migrate.js`

## If you want to use SSL locally (e.g. to test Facebook authentication)
* `mkdir ./server/private/`
* Create and install a self-signed certificate locally. We recommend using https://github.com/FiloSottile/mkcert
* Move the key created to ./server/private/privatekey.pem and the certificate to ./server/private/certificate.pem

# Run app locally
* `npm run start`
* Start up the Alchemy Client app

# Development

## Migrations

After changing any model definition (.json) files, run: `node ./server/migrate.js`
