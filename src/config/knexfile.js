require(`dotenv`).config({ path: `../../.env` })
module.exports = {
  client: `pg`,
  connection: {
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASS,
    port: process.env.PG_PORT,
    database: process.env.PG_DB
  },
  pool: { 
    min: 0, 
    max: 7 
  }
}