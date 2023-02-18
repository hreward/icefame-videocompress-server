const mysql = require('mysql');

// const con = mysql.createConnection({
var con  = mysql.createPool({
  connectionLimit : 10,
  host: "localhost",
  user: "mastpalc_icefame",
  password: "SKT6!RHOZ7o!",
  database: "mastpalc_icefame"
});

module.exports = con;