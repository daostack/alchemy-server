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
* Add a .env file to the root directory with the following:
```
SESSION_SECRET=anylongstringoftext
COOKIE_SECRET=anotherlongstringoftext
```
* If you want to support OAuth with Facebook, Twitter and/or GitHub you will need to add consumer client ids and secrets to .env
```
FACEBOOK_APP_ID={grab from app at https://developers.facebook.com/apps/214528186128969)
FACEBOOK_APP_SECRET={grab from app at https://developers.facebook.com/apps/214528186128969}
TWITTER_CONSUMER_KEY={grab from app at https://developer.twitter.com/en/apps/15974878}
TWITTER_CONSUMER_SECRET={grab from app at https://developer.twitter.com/en/apps/15974878}
GITHUB_CLIENT_ID={grab from https://github.com/settings/applications/944507}
GITHUB_CLIENT_SECRET={grab from https://github.com/settings/applications/944507}
```

## If you want to use SSL locally (e.g. to test Facebook OAuth authentication)
* `mkdir ./server/private/`
* Create and install a self-signed certificate locally. We recommend using https://github.com/FiloSottile/mkcert
* Move the key created to ./server/private/privatekey.pem and the certificate to ./server/private/certificate.pem
* You will also need to update the API_URL in the Alchemy Client .env file to `API_URL=https://127.0.0.1:3001`

# Run app locally
* `npm run start`
* Start up the Alchemy Client app

# Development

## Migrations

After changing any model definition (.json) files, run: `node ./server/migrate.js`
