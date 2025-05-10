const sql = require("mssql");
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true, 
    trustServerCertificate: true, 
  },
};

module.exports = dbConfig;
