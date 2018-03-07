module.exports = {
  postgresql: {
    connector: 'postgresql',
    url: process.env.DATABASE_URL
    //host: process.env.DB_HOST || 'localhost',
    //port: 5432,
    //user: process.env.DB_USER,
    //password: process.env.DB_PASSWORD,
    //database: 'alchemy',
  }
};